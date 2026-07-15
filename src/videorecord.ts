// Source - https://stackoverflow.com/a/62065826
// Posted by pery mimon, modified by community. See post 'Timeline' for change history
// Retrieved 2026-07-14, License - CC BY-SA 4.0

export function record(canvas: HTMLCanvasElement, audioElement?: HTMLAudioElement | number | null, duration?: number): Promise<string> {
  // Support the previous record(canvas, duration) form too.
  if (typeof audioElement === "number") {
    duration = audioElement;
    audioElement = null;
  }

  const videoStream = canvas.captureStream(30);
  const tracks: MediaStreamTrack[] = [...videoStream.getVideoTracks()];
  const audioStream = (audioElement as any)?.captureStream?.() || audioElement?.mozCaptureStream?.();
  if (audioStream) tracks.push(...audioStream.getAudioTracks());

  const stream = new MediaStream(tracks);
  const preferredMimeType = "video/webm;codecs=vp9,opus";
  const options = MediaRecorder.isTypeSupported(preferredMimeType) ? { mimeType: preferredMimeType } : undefined;

  return new Promise(function (resolve, reject) {
    let mediaRecorder: MediaRecorder;
    try {
      mediaRecorder = new MediaRecorder(stream, options);
    } catch (error) {
      reject(error);
      return;
    }

    const recordedChunks: BlobPart[] = [];
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) recordedChunks.push(event.data);
    };
    mediaRecorder.onerror = (event) => reject((event as any).error);
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType || "video/webm" });
      resolve(URL.createObjectURL(blob));
    };

    mediaRecorder.start();
    window.setTimeout(() => {
      if (mediaRecorder.state === "recording") mediaRecorder.stop();
    }, duration || 4000);
  });
}
