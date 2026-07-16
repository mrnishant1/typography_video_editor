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

let currentMediaRecorder: MediaRecorder | null = null;
let currentAudioContext: AudioContext | null = null;
let currentAudioStream: MediaStream | null = null;

export async function record(canvas: HTMLCanvasElement, audioElement?: HTMLAudioElement | number | null, duration?: number): Promise<string> {
  // Support the previous record(canvas, duration) form too.
  if (typeof audioElement === "number") {
    duration = audioElement;
    audioElement = null;
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
  let frameId: number | null = null;
  let shouldDraw = true;

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
  
  // Capture audio from system and audioElement
  const audioContext = new AudioContext();
  currentAudioContext = audioContext;
  const audioDestination = audioContext.createMediaStreamDestination();
  
  // Add audio element if provided
  if (audioElement instanceof HTMLAudioElement) {
    const audioSource = audioContext.createMediaElementSource(audioElement);
    audioSource.connect(audioDestination);
  }
  
  // Capture microphone/system audio
  try {
    const userAudio = await navigator.mediaDevices.getUserMedia({ audio: true });
    userAudio.getAudioTracks().forEach(track => {
      const source = audioContext.createMediaStreamSource(userAudio);
      source.connect(audioDestination);
    });
  } catch (err) {
    console.warn("Microphone access denied or unavailable");
  }
  
  tracks.push(...audioDestination.stream.getAudioTracks());

  const stream = new MediaStream(tracks);
  currentAudioStream = stream;
  
  // Prefer mp4 if supported, fallback to webm
  let mimeType = "video/webm;codecs=vp9,opus";
  if (MediaRecorder.isTypeSupported("video/mp4;codecs=avc1.42E01E,mp4a.40.2")) {
    mimeType = "video/mp4;codecs=avc1.42E01E,mp4a.40.2";
  } else if (MediaRecorder.isTypeSupported("video/mp4")) {
    mimeType = "video/mp4";
  } else if (MediaRecorder.isTypeSupported("video/webm")) {
    mimeType = "video/webm";
  }
  const options = { mimeType };

  return new Promise(function (resolve, reject) {
    const stopDrawing = () => {
      shouldDraw = false;
      if (frameId !== null) cancelAnimationFrame(frameId);
    };
    let mediaRecorder: MediaRecorder;
    try {
      mediaRecorder = new MediaRecorder(stream, options);
      currentMediaRecorder = mediaRecorder;
    } catch (error) {
      stopDrawing();
      reject(error);
      return;
    }

    const recordedChunks: BlobPart[] = [];
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) recordedChunks.push(event.data);
    };
    mediaRecorder.onerror = (event) => {
      stopDrawing();
      reject((event as any).error);
    };
    mediaRecorder.onstop = () => {
      stopDrawing();
      const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType || mimeType });
      resolve(URL.createObjectURL(blob));
    };

    mediaRecorder.start();
    
    if (duration) {
      window.setTimeout(() => {
        if (mediaRecorder.state === "recording") mediaRecorder.stop();
      }, duration);
    }
  });
}

export function stopRecordingAndDownload(filename: string = "recording.mp4"): void {
  if (!currentMediaRecorder || currentMediaRecorder.state === "inactive") {
    console.warn("No active recording to stop");
    return;
  }

  const recordedChunks: BlobPart[] = [];
  const mimeType = currentMediaRecorder.mimeType || "video/webm";

  currentMediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) recordedChunks.push(event.data);
  };

  currentMediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Clean up
    if (currentAudioContext) {
      currentAudioContext.close();
      currentAudioContext = null;
    }
    currentAudioStream?.getTracks().forEach(track => track.stop());
    currentAudioStream = null;
    currentMediaRecorder = null;
  };

  currentMediaRecorder.stop();
}

