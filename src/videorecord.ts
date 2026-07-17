// Source - https://stackoverflow.com/a/62065826
// Posted by pery mimon, modified by community. See post 'Timeline' for change history
// Retrieved 2026-07-14, License - CC BY-SA 4.0

/** Draw an image using the same `cover` behaviour used by the canvas preview. */
function drawCover(context: CanvasRenderingContext2D, image: CanvasImageSource, width: number, height: number): void {
  const imageWidth = (image as HTMLImageElement).naturalWidth || (image as HTMLVideoElement).videoWidth;
  const imageHeight = (image as HTMLImageElement).naturalHeight || (image as HTMLVideoElement).videoHeight;
  if (!imageWidth || !imageHeight) return;

  const scale = Math.max(width / imageWidth, height / imageHeight);
  const drawWidth = imageWidth * scale;
  const drawHeight = imageHeight * scale;
  context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
}

function getCanvasBackground(canvas: HTMLCanvasElement): Promise<HTMLImageElement | null> {
  const backgroundImage = getComputedStyle(canvas).backgroundImage;
  const match = /^url\(["']?(.*?)["']?\)$/.exec(backgroundImage);
  if (!match?.[1] || match[1] === "none") return Promise.resolve(null);

  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = match[1];
  });
}

interface RecordingSession {
  mediaRecorder: MediaRecorder;
  stream: MediaStream;
  stopDrawing: () => void;
}

let activeSession: RecordingSession | null = null;

export async function recordFrames(canvas: HTMLCanvasElement, duration?: number): Promise<string> {
  
  if (activeSession) {
    throw new Error("record() called while a recording is already in progress.");
  }

  // CSS backgrounds are not pixels in the canvas bitmap, so capture a second
  // canvas where the preview background and the rendered canvas are composed.
  const recordingCanvas = document.createElement("canvas");
  recordingCanvas.width = canvas.width;
  recordingCanvas.height = canvas.height;
  const recordingContext = recordingCanvas.getContext("2d");
  if (!recordingContext) throw new Error("Unable to create a recording canvas");

  const bgVideo = document.getElementById("bg-video") as HTMLVideoElement | null;
  const isVideoBg = !!(bgVideo && bgVideo.style.display !== "none" && bgVideo.src);

  const background = isVideoBg ? null : await getCanvasBackground(canvas);
  const backgroundColor = getComputedStyle(canvas).backgroundColor;


  // const background = await getCanvasBackground(canvas);
  // const backgroundColor = getComputedStyle(canvas).backgroundColor;
  let frameId: number | null = null;
  let shouldDraw = true;

  const stopDrawing = () => {
    console.log("stop was called to stop recording");
    shouldDraw = false;
    if (frameId !== null) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }
  };

  // const drawFrame = () => {
  //   if (!shouldDraw) return;
  //   recordingContext.clearRect(0, 0, recordingCanvas.width, recordingCanvas.height);
  //   if (backgroundColor && backgroundColor !== "rgba(0, 0, 0, 0)") {
  //     recordingContext.fillStyle = backgroundColor;
  //     recordingContext.fillRect(0, 0, recordingCanvas.width, recordingCanvas.height);
  //   }
  //   if (background) drawCover(recordingContext, background, recordingCanvas.width, recordingCanvas.height);
  //   recordingContext.drawImage(canvas, 0, 0, recordingCanvas.width, recordingCanvas.height);
  //   frameId = requestAnimationFrame(drawFrame);
  // };
  // drawFrame();

  const drawFrame = () => {
    if (!shouldDraw) return;

    recordingContext.clearRect(0, 0, recordingCanvas.width, recordingCanvas.height);

    if (backgroundColor && backgroundColor !== "rgba(0, 0, 0, 0)") {
      recordingContext.fillStyle = backgroundColor;
      recordingContext.fillRect(0, 0, recordingCanvas.width, recordingCanvas.height);
    }

    if (isVideoBg && bgVideo) {
      drawCover(recordingContext, bgVideo, recordingCanvas.width, recordingCanvas.height);
    } else if (background) {
      drawCover(recordingContext, background, recordingCanvas.width, recordingCanvas.height);
    }

    recordingContext.drawImage(canvas, 0, 0, recordingCanvas.width, recordingCanvas.height);
    frameId = requestAnimationFrame(drawFrame);
  };

  drawFrame();

  const videoStream = recordingCanvas.captureStream(30);
  const tracks: MediaStreamTrack[] = [...videoStream.getVideoTracks()];
  // const audioStream = (audioElement as any)?.captureStream?.() || audioElement?.mozCaptureStream?.();
  // if (audioStream) tracks.push(...audioStream.getAudioTracks());

  const stream = new MediaStream(tracks);
  const preferredMimeType = "video/webm;codecs=vp9,opus";
  const options = MediaRecorder.isTypeSupported(preferredMimeType) ? { mimeType: preferredMimeType } : undefined;

  let mimeType = preferredMimeType || "video/webm;codecs=vp9,opus";
  if (MediaRecorder.isTypeSupported("video/mp4;codecs=avc1.42E01E,mp4a.40.2")) {
    mimeType = "video/mp4;codecs=avc1.42E01E,mp4a.40.2";
  } else if (MediaRecorder.isTypeSupported("video/mp4")) {
    mimeType = "video/mp4";
  } else if (MediaRecorder.isTypeSupported("video/webm")) {
    mimeType = "video/webm";
  }

  return new Promise<string>((resolve, reject) => {
    const chunks: BlobPart[] = [];
    let cleanedUp = false;

    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      stopDrawing();
      console.log("cleanup was called to stop recording");

      // audioContext.close();
      stream.getTracks().forEach((track) => track.stop());
      activeSession = null;
    };

    try {
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      activeSession = { mediaRecorder, stream, stopDrawing };

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      mediaRecorder.onerror = (event) => {
        cleanup();
        reject((event as any).error ?? new Error("MediaRecorder error"));
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mediaRecorder.mimeType || mimeType });
        resolve(URL.createObjectURL(blob));
        window.setTimeout(cleanup, 0);
        console.log("mediarecorder.onstop was called to mediarecorder.onstop recording");
      };

      mediaRecorder.start(250);

      if (duration) {
        const stopAfterMs = Math.max(1000, duration);
        if (duration < 1000) {
          console.warn(`record(): duration=${duration} is under 1000 (expected ms). Clamped to 1000ms.`);
        }
        const startedAt = performance.now();

        const timer = window.setInterval(() => {
          if (performance.now() - startedAt >= stopAfterMs) {
            clearInterval(timer);
            if (mediaRecorder.state === "recording") {
              mediaRecorder.requestData();
              mediaRecorder.stop();
              console.log("clearInterval was called to clearInterval recording");
            }
          }
        }, 100);
      }
    } catch (error) {
      cleanup();
      reject(error);
    }
  });
}

export function stopRecordingAndDownload(): void {
  if (!activeSession || activeSession.mediaRecorder.state !== "recording") {
    throw console.error("stop was called to stop recording");
  }
  console.log("stop recording called");
  activeSession.mediaRecorder.requestData();
  activeSession.mediaRecorder.stop();
}
