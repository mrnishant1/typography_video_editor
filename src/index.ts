import "./index.css";
import { stopRecordingAndDownload } from "./videorecord";
import { getWordsPerRender, recordingVideo, renderInstanceSubtitle, sentenceToWords, srtToJson } from "./used_functions";
import type { SubtitleEntry, SubtitleStyleOptions, WordEntry } from "./types";

const canvas = document.getElementById("canvas") as HTMLCanvasElement | null;

// Canvas configuration storage
export interface CanvasConfig {
  width: number;
  height: number;
  orientation: "16:9" | "9:16";
  resolution: "1080" | "1440" | "2160" | "custom";
}

window.subtitleStyleOptions = {
  fontFamily: "'Creepster'",
  fontSize: "200",
  fontWeight: "400",
  fontStyle: "normal",
  font: "200px 'Creepster'",
  fillStyle: "#FFFFFF",
  strokeStyle: "#000000",
  lineWidth: 2,
  shadowBlur: 10,
  shadowColor: "rgba(0, 0, 0, 0.96)",
  shadowOffsetX: 10,
  shadowOffsetY: 10,
  textAlign: "left",
  rotation: "0",
  scale: "1",
  opacity: "1",
} as SubtitleStyleOptions;

const font = new FontFace("MyFont", "url('/lavish.ttf')");

await font.load();
document.fonts.add(font);
// Apply canvas settings to DOM

console.log(canvas);
let ctx: CanvasRenderingContext2D | null = null;
if (canvas) {
  ctx = canvas.getContext("2d");
}

// Create and configure dynamic background video element
export const bgVideo = document.createElement("video");
bgVideo.id = "bg-video";
bgVideo.muted = false;
bgVideo.loop = false;
bgVideo.playsInline = true;
bgVideo.style.position = "absolute";
bgVideo.style.top = "0";
bgVideo.style.left = "0";
bgVideo.style.width = "100%";
bgVideo.style.height = "100%";
bgVideo.style.objectFit = "cover";
bgVideo.style.zIndex = "0";
bgVideo.style.display = "none";
bgVideo.style.borderRadius = "4px";

if (canvas) {
  const parent = canvas.parentElement;
  if (parent) {
    parent.style.position = "relative";
    parent.insertBefore(bgVideo, canvas);
  }
  canvas.style.position = "relative";
  canvas.style.zIndex = "1";
}
//=======================Load Transcript============================

let transcript = `1
00:00:00,000 --> 00:00:00,350
Welcome!

2
00:00:00,710 --> 00:00:01,750
Thanks for stopping by.

3
00:00:02,210 --> 00:00:05,510
Just upload .srt subtitle file and audio to

4
00:00:05,510 --> 00:00:06,770
generate dynamic subtitle.

5
00:00:07,029 --> 00:00:08,950
I built this subtitle generator to make creating

6
00:00:08,950 --> 00:00:11,390
clean, accurate subtitles as simple and fast as

7
00:00:11,390 --> 00:00:11,790
possible.

8
00:00:12,530 --> 00:00:15,650
Whether you're making YouTube videos, reels, tutorials, or

9
00:00:15,650 --> 00:00:17,590
anything else, I hope this tool saves you

10
00:00:17,590 --> 00:00:19,290
time and makes your workflow a little easier.

11
00:00:20,230 --> 00:00:21,850
This project is built and maintained by a

12
00:00:21,850 --> 00:00:24,290
single developer, and I'm constantly working to improve

13
00:00:24,290 --> 00:00:25,070
it based on feedback.

14
00:00:25,710 --> 00:00:27,390
Thank you for using the site, and happy

15
00:00:27,390 --> 00:00:27,730
creating!
`;
let audioPlayer: HTMLAudioElement | null = null;
let audioSourceUrl: string | null = null;
let backgroundImageSrc: string | null = null;

//===================Helper Utilities==============================
function formatTime(ms: number): string {
  if (isNaN(ms) || ms < 0) return "00:00.00";
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const centiseconds = Math.floor((ms % 1000) / 10);

  const mStr = String(minutes).padStart(2, "0");
  const sStr = String(seconds).padStart(2, "0");
  const cStr = String(centiseconds).padStart(2, "0");

  return `${mStr}:${sStr}.${cStr}`;
}

let jsonSubtitles: SubtitleEntry[] = srtToJson(transcript);
let timelineFrameId: number | null = null;
let pr_ms_FrameID: number | null = null;
let stopTimelineRenderer = false;

//===================Timeline HTML=================================

let GlobalTimeLine = jsonSubtitles[jsonSubtitles.length - 1]?.end || 0;
window.GlobalTimeline = GlobalTimeLine;

const time_content = document.getElementById("time_content");

function renderTimeline(subtitles: SubtitleEntry[]): void {
  jsonSubtitles = subtitles;
  // Fall back to subtitle length only if no custom audio or video duration is set
  if (!audioSourceUrl && bgVideo.style.display === "none") {
    GlobalTimeLine = jsonSubtitles[jsonSubtitles.length - 1]?.end || 0;
  }

  // Expose duration and subtitle count for the stats panel
  window.audioDuration = GlobalTimeLine;
  window.subtitlesCount = jsonSubtitles.length;
  window.updateStatsDashboard?.();

  const totalTimeEl = document.getElementById("total-time");
  if (totalTimeEl) {
    totalTimeEl.textContent = formatTime(GlobalTimeLine);
  }

  if (!time_content) return;

  time_content.innerHTML = `<div id="timeline_progress" style="z-index:1"></div>
    <div id="subtitle_in_timeline" style="position: relative; height:100px"></div>
    `;
  const subtitle_in_timeline = document.getElementById("subtitle_in_timeline");
  if (subtitle_in_timeline) {
    const blocks = jsonSubtitles.map((element) => {
      const start = (element.start / Math.max(GlobalTimeLine, 1)) * time_content.offsetWidth;
      const end = (element.end / Math.max(GlobalTimeLine, 1)) * time_content.offsetWidth;
      const width = end - start;
      return `<div id="subtitle" style="position:absolute; left:${start}px; width:${width}px;  background:rgba(255, 0, 0, 0.38); color:white; font-size:14px; overflow:hidden;
         text-overflow:ellipsis; white-space:nowrap; box-sizing:border-box; padding:2px 4px;">${element.text}</div>`;
    });
    subtitle_in_timeline.innerHTML = blocks.join("");
  }
}

// Function to update timeline duration and reset stats/time readouts
function updateTimelineLength(durationMs: number): void {
  GlobalTimeLine = durationMs;
  window.GlobalTimeline = GlobalTimeLine;
  window.audioDuration = GlobalTimeLine;
  window.updateStatsDashboard?.();
  const totalTimeEl = document.getElementById("total-time");
  if (totalTimeEl) {
    totalTimeEl.textContent = formatTime(GlobalTimeLine);
  }
  renderTimeline(jsonSubtitles);
}

renderTimeline(jsonSubtitles);

//===================Timeline Renderer=================================
function timelineRenderer(jsonSubtitles: SubtitleEntry[], char_per_line: number = 1, timelineLength: number = GlobalTimeLine): void {
  const scaleFactor = 1;
  let prev_timestamp: number | null = null;
  let globalTimelineProgress = 0;

  const timelineProgress = document.getElementById("timeline_progress") as HTMLElement;

  let current_subtitle = 0;
  let renderedSubtitle: number | null = null;

  function renderer(timestamp: number) {
    if (!prev_timestamp) prev_timestamp = timestamp;
    const deltaTime = timestamp - prev_timestamp;
    globalTimelineProgress = Math.min(deltaTime / timelineLength, 1);

    if (timelineProgress && time_content) {
      timelineProgress.style.left = `${globalTimelineProgress * time_content.offsetWidth}px`;
    }

    // Update live timestamp in the playhead readout
    const currentTimeEl = document.getElementById("current-time");
    if (currentTimeEl) {
      currentTimeEl.textContent = formatTime(Math.min(deltaTime, timelineLength));
    }

    // Keep background video in sync with playhead
    if (bgVideo && bgVideo.style.display !== "none" && !bgVideo.paused) {
      const targetTime = deltaTime / 1000;
      if (Math.abs(bgVideo.currentTime - targetTime) > 0.15) {
        bgVideo.currentTime = targetTime;
      }
    }

    const subtitle = jsonSubtitles[current_subtitle];

    if (subtitle && deltaTime > subtitle.end) {
      current_subtitle += 1;
      renderedSubtitle = null;
    }

    const currentSubtitle = jsonSubtitles[current_subtitle];

    if (currentSubtitle && deltaTime >= currentSubtitle.start && deltaTime <= currentSubtitle.end && renderedSubtitle !== current_subtitle) {
      //start rendering
      pr_ms_FrameID = renderInstanceSubtitle(currentSubtitle as unknown as WordEntry, char_per_line, ctx, window.subtitleStyleOptions);
      renderedSubtitle = current_subtitle;
    }

    if (globalTimelineProgress < 1 && !stopTimelineRenderer) {
      timelineFrameId = requestAnimationFrame(renderer);
    } else {
      globalTimelineProgress = 1;
      stopTimeline();
      if (currentTimeEl) {
        currentTimeEl.textContent = formatTime(timelineLength);
      }
    }
    // renderInstanceSubtitle(jsonSubtitles[0])
  }
  console.log("hi");
  timelineFrameId = requestAnimationFrame(renderer);
}
//======================= Handlers -- Audio/Image/Video===========================================
function handleTranscriptUpload(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    transcript = reader.result as string;
    jsonSubtitles = srtToJson(transcript);
    renderTimeline(jsonSubtitles);
    stopTimeline();
    if (audioPlayer) {
      audioPlayer.pause();
      audioPlayer.currentTime = 0;
    }
    isclicked = false;

    // Reset playhead timer readout
    const currentTimeEl = document.getElementById("current-time");
    if (currentTimeEl) currentTimeEl.textContent = "00:00.00";
  };
  reader.readAsText(file);
}

function handleAudioUpload(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  if (audioSourceUrl) {
    URL.revokeObjectURL(audioSourceUrl);
  }

  audioSourceUrl = URL.createObjectURL(file);
  const player = new Audio(audioSourceUrl);
  audioPlayer = player;
  player.pause();
  player.currentTime = 0;

  player.addEventListener("loadedmetadata", () => {
    updateTimelineLength(player.duration * 1000);
  });

  stopTimeline();
  isclicked = false;

  // Reset playhead timer readout
  const currentTimeEl = document.getElementById("current-time");
  if (currentTimeEl) currentTimeEl.textContent = "00:00.00";
}

function handleBackgroundUpload(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  if (backgroundImageSrc && backgroundImageSrc.startsWith("blob:")) {
    URL.revokeObjectURL(backgroundImageSrc);
  }

  backgroundImageSrc = URL.createObjectURL(file);

  if (file.type.startsWith("video/")) {
    if (canvas) {
      canvas.style.backgroundImage = "none";
    }
    bgVideo.src = backgroundImageSrc;
    bgVideo.style.display = "block";
    bgVideo.load();
    bgVideo.addEventListener("loadedmetadata", () => {
      updateTimelineLength(bgVideo.duration * 1000);
    });
  } else {
    bgVideo.style.display = "none";
    bgVideo.src = "";

    const bgImage = new Image();
    bgImage.onload = () => {
      if (canvas) {
        canvas.style.backgroundImage = `url(${backgroundImageSrc})`;
        canvas.style.backgroundSize = "cover";
        canvas.style.backgroundPosition = "center";
      }
    };
    bgImage.src = backgroundImageSrc;
  }
}

//Default Image
backgroundImageSrc = "/bg.jpeg";
const bgImage = new Image();
bgImage.onload = () => {
  if (canvas) {
    canvas.style.backgroundImage = `url(${backgroundImageSrc})`;
    canvas.style.backgroundSize = "cover";
    canvas.style.backgroundPosition = "center";
  }
};
bgImage.onerror = () => {
  console.error("Failed to load background image", backgroundImageSrc);
};
bgImage.src = backgroundImageSrc;

// Fetch default audio duration on load
const defaultAudio = new Audio("/speech.mp3");

defaultAudio.addEventListener("loadedmetadata", () => {
  if (!audioSourceUrl && bgVideo.style.display === "none") {
    updateTimelineLength(defaultAudio.duration * 1000);
  }
});

//===================Handle Play/Stop/Restart================================
let isclicked = false;
function stopTimeline({ stopRecording = false } = {}): void {
  stopTimelineRenderer = true;
  if (timelineFrameId !== null) {
    cancelAnimationFrame(timelineFrameId);
    if (pr_ms_FrameID !== null) cancelAnimationFrame(pr_ms_FrameID);
    timelineFrameId = null;
    pr_ms_FrameID = null;
  }

  if (stopRecording) {
    stopRecordingAndDownload();
    isRecording = false;
  }

  if (audioPlayer) {
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
  }
}

async function safePlayMedia(media: HTMLMediaElement, label: string): Promise<void> {
  try {
    await media.play();
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      console.log(`${label} play deferred: play request was aborted.`);
    } else {
      console.log(`${label} play deferred:`, err);
    }
  }
}

async function playAu(): Promise<void> {
  if (!audioPlayer) {
    audioPlayer = new Audio("/speech.mp3");
  }

  audioPlayer.currentTime = 0;
  await safePlayMedia(audioPlayer, "Audio");

  if (bgVideo && bgVideo.style.display !== "none" && bgVideo.src) {
    bgVideo.currentTime = 0;
    await safePlayMedia(bgVideo, "Background video");
  }
}

function restartTimeline(): void {
  stopTimeline({ stopRecording: isRecording });
  playAu();
  timelineRenderer(jsonSubtitles, getWordsPerRender());
  stopTimelineRenderer = false;
}
// ---- Play / Stop transport controls ----
// Same play/restart logic as before, now driven by two explicit buttons
// instead of one ambiguous "Play controls" div.
document.getElementById("playButton")?.addEventListener("click", () => {
  if (!isclicked) {
    playAu();
    timelineRenderer(jsonSubtitles, getWordsPerRender());
    isclicked = true;
  } else {
    restartTimeline();
  }
});

document.getElementById("stopButton")?.addEventListener("click", () => {
  stopTimeline({ stopRecording: isRecording });
  // audioPlayer?.pause();
  isclicked = false;

  // Reset playhead timer readout and playhead location
  const currentTimeEl = document.getElementById("current-time");
  if (currentTimeEl) currentTimeEl.textContent = "00:00.00";

  const timelineProgress = document.getElementById("timeline_progress") as HTMLElement;
  if (timelineProgress) {
    timelineProgress.style.left = "0px";
  }

  // Pause and reset background video
  if (bgVideo) {
    bgVideo.pause();
    bgVideo.currentTime = 0;
  }
});

window.restartTimelineRenderer = restartTimeline;
document.getElementById("transcriptInput")?.addEventListener("change", handleTranscriptUpload);
document.getElementById("audioInput")?.addEventListener("change", handleAudioUpload);
document.getElementById("backgroundInput")?.addEventListener("change", handleBackgroundUpload);

//====================================Draw Rect approach for subs========================

//==================================Record ========================================

let isRecording = false;
document.getElementById("recordButton")?.addEventListener("click", async () => {
  if (isRecording) {
    throw new Error("record() called while a recording is already in progress.");
  }

  restartTimeline();

  if (!canvas) {
    console.log("no canvas");
    return;
  }
  isRecording = true;
  console.log("audio timeline, isrecording", GlobalTimeLine, isRecording);
  recordingVideo(canvas, GlobalTimeLine, audioPlayer);
});
