import "./index.css";
import { record } from "./videorecord";
import { renderInstanceSubtitle, sentenceToWords, srtToJson } from "./wordrenderer";
import { pickRandom } from "./wordrenderer";
import type { SubtitleEntry, SubtitleStyleOptions, WordEntry } from "./types";

const canvas = document.getElementById("canvas") as HTMLCanvasElement | null;

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

// ctx.font = "40px MyFont";
// ctx.fillText("Custom Font", 50, 100);

console.log(canvas);
let ctx: CanvasRenderingContext2D | null = null;
if (canvas) {
  canvas.height = 1080;
  canvas.width = 1920;
  ctx = canvas.getContext("2d");
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

let jsonSubtitles: SubtitleEntry[] = srtToJson(transcript);
const wordJsonSub: WordEntry[] = sentenceToWords(jsonSubtitles);
let timelineFrameId: number | null = null;
let pr_ms_FrameID: number | null = null;
let stopTimelineRenderer = false;

//===================Timeline HTML=================================
const timelineStarting = 0;
let audioTimeline = jsonSubtitles[jsonSubtitles.length - 1]?.end || 0;

const time_content = document.getElementById("time_content");

function renderTimeline(subtitles: SubtitleEntry[]): void {
  jsonSubtitles = subtitles;
  audioTimeline = jsonSubtitles[jsonSubtitles.length - 1]?.end || 0;

  if (!time_content) return;

  time_content.innerHTML = `<div id="timeline_progress" style="z-index:1"></div>
    <div id="subtitle_in_timeline" style="position: relative; height:100px"></div>
    `;
  const subtitle_in_timeline = document.getElementById("subtitle_in_timeline");
  if (subtitle_in_timeline) {
    const blocks = jsonSubtitles.map((element) => {
      const start = (element.start / Math.max(audioTimeline, 1)) * time_content.offsetWidth;
      const end = (element.end / Math.max(audioTimeline, 1)) * time_content.offsetWidth;
      const width = end - start;
      return `<div id="subtitle" style="position:absolute; left:${start}px; width:${width}px; height:100%; background:rgba(255, 0, 0, 0.38); color:white; font-size:14px; overflow:hidden;
         text-overflow:ellipsis; white-space:nowrap; box-sizing:border-box; padding:2px 4px;">${element.text}</div>`;
    });
    subtitle_in_timeline.innerHTML = blocks.join("");
  }
}

renderTimeline(jsonSubtitles);

//===================Timeline Renderer=================================
function timelineRenderer(jsonSubtitles: SubtitleEntry[], char_per_line: number = 1, timelineLength: number = audioTimeline): void {
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
    timelineProgress.style.left = `${globalTimelineProgress * (time_content as HTMLElement).offsetWidth}px`;
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
    }
    // renderInstanceSubtitle(jsonSubtitles[0])
  }
  console.log("hi");
  timelineFrameId = requestAnimationFrame(renderer);
}

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
  audioPlayer = new Audio(audioSourceUrl);
  audioPlayer.pause();
  audioPlayer.currentTime = 0;
  stopTimeline();
  isclicked = false;
}

//===================Handle Play/Stop/Restart================================
let audioPlayer: HTMLAudioElement | null = null;
let audioSourceUrl: string | null = null;
let backgroundImageSrc: string | null = null;

function playAu(): void {
  if (!audioPlayer) {
    audioPlayer = new Audio("/speech.mp3");
  }

  audioPlayer.pause();
  audioPlayer.currentTime = 0;
  audioPlayer.play();
}

//=======================Background===========================================
function handleBackgroundUpload(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  if (backgroundImageSrc && backgroundImageSrc.startsWith("blob:")) {
    URL.revokeObjectURL(backgroundImageSrc);
  }

  backgroundImageSrc = URL.createObjectURL(file);
  const bgImage = new Image();
  bgImage.onload = () => {
    if (canvas) {
      canvas.style.backgroundImage = `url(${backgroundImageSrc})`;
      canvas.style.backgroundSize = "cover";
      canvas.style.backgroundPosition = "center";
    }
  };
  bgImage.onerror = () => {
    console.error("Failed to load background image", file.name);
  };
  bgImage.src = backgroundImageSrc;
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

function getWordsPerRender(): number {
  return parseInt((document.getElementsByName("Word_per_render")[0] as HTMLSelectElement)?.value, 10) || 4;
}
let isclicked = false;

function stopTimeline(): void {
  stopTimelineRenderer = true;
  if (timelineFrameId !== null) {
    cancelAnimationFrame(timelineFrameId);
    if (pr_ms_FrameID !== null) cancelAnimationFrame(pr_ms_FrameID);
    timelineFrameId = null;
    pr_ms_FrameID = null;
  }
}

function restartTimeline(): void {
  stopTimeline();
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
  // stopTimeline() itself only ever cancelled the animation frames — it never
  // touched audio playback. Pausing the audio here too, and resetting
  // isclicked, is the only new behavior added: it's what makes "Stop" actually
  // stop, and lets the next Play press start fresh instead of restarting.
  stopTimeline();
  audioPlayer?.pause();
  isclicked = false;
});

window.restartTimelineRenderer = restartTimeline;
document.getElementById("transcriptInput")?.addEventListener("change", handleTranscriptUpload);
document.getElementById("audioInput")?.addEventListener("change", handleAudioUpload);
document.getElementById("backgroundInput")?.addEventListener("change", handleBackgroundUpload);

//==================================Record ========================================
function recordingVideo(canvas: HTMLCanvasElement, time: number): void {
  const recording = record(canvas, time);
  // play it on another video element
  var video$ = document.createElement("video");
  document.body.appendChild(video$);
  recording.then((url) => video$.setAttribute("src", url));

  // download it
  var link$ = document.createElement("a");
  link$.innerText = "download";
  link$.setAttribute("download", "recordingVideo");
  recording.then((url) => {
    link$.setAttribute("href", url);
    link$.click();
  });
}

document.getElementById("recordButton")?.addEventListener("click", (e) => {
  restartTimeline();
  if (canvas) recordingVideo(canvas, audioTimeline);
});
