const canvas = document.getElementById("canvas");
import {
  globalCanvasTextProperties,
  renderInstanceSubtitle,
  sentenceToWords,
  srtToJson,
} from "./sideProps.js";
import { pickRandom } from "./sideProps.js";

window.subtitleStyleOptions = {
  fontFamily: "'Akronim'",
  fontSize: "200",
  fontWeight: "400",
  fontStyle: "normal",
  font: "200px 'Akronim'",
  fillStyle: "#4800ff",
  strokeStyle: "#000000",
  lineWidth: 2,
  shadowBlur: 10,
  shadowColor: "rgba(0, 0, 0, 0.96)",
  shadowOffsetX: 10,
  shadowOffsetY: 10,
  textAlign: "left",
};

const font = new FontFace("MyFont", "url('lavish.ttf')");

await font.load();
document.fonts.add(font);

// ctx.font = "40px MyFont";
// ctx.fillText("Custom Font", 50, 100);

console.log(canvas);
let ctx = null;
if (canvas) {
  canvas.height = 1080;
  canvas.width = 1920;
  ctx = canvas.getContext("2d");
}
//=======================Load Transcript============================

let transcript = ``

let jsonSubtitles = srtToJson(transcript);
const wordJsonSub = sentenceToWords(jsonSubtitles);
let timelineFrameId = null;
let pr_ms_FrameID = null;
let stopTimelineRenderer = false;

//===================Timeline HTML=================================
const timelineStarting = 0;
let audioTimeline = jsonSubtitles[jsonSubtitles.length - 1]?.end || 0;

const time_content = document.getElementById("time_content");

function renderTimeline(subtitles) {
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
function timelineRenderer(
  jsonSubtitles,
  char_per_line = 1,
  timelineLength = audioTimeline,
) {
  const scaleFactor = 1;
  let prev_timestamp = null;
  let globalTimelineProgress = 0;

  const timelineProgress = document.getElementById("timeline_progress");

  let current_subtitle = 0;
  let renderedSubtitle = null;

  function renderer(timestamp) {
    if (!prev_timestamp) prev_timestamp = timestamp;
    const deltaTime = timestamp - prev_timestamp;
    globalTimelineProgress = Math.min(deltaTime / timelineLength, 1);
    timelineProgress.style.left = `${globalTimelineProgress * time_content.offsetWidth}px`;
    const subtitle = jsonSubtitles[current_subtitle];

    if (subtitle && deltaTime > subtitle.end) {
      current_subtitle += 1;
      renderedSubtitle = null;
    }

    const currentSubtitle = jsonSubtitles[current_subtitle];

    if (
      currentSubtitle &&
      deltaTime >= currentSubtitle.start &&
      deltaTime <= currentSubtitle.end &&
      renderedSubtitle !== current_subtitle
    ) {
      //start rendering

      pr_ms_FrameID = renderInstanceSubtitle(
        currentSubtitle,
        char_per_line,
        ctx,
        window.subtitleStyleOptions,
      );
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

function handleTranscriptUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    transcript = reader.result;
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

function handleAudioUpload(event) {
  const file = event.target.files?.[0];
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
let audioPlayer = null;
let audioSourceUrl = null;

function playAu() {
  if (!audioPlayer) {
    audioPlayer = new Audio("./final.m4a");
  }

  audioPlayer.pause();
  audioPlayer.currentTime = 0;
  audioPlayer.play();
}


let isclicked = false;
document.getElementById("play").addEventListener("click", () => {
  if (!isclicked) {
    playAu();
    timelineRenderer(jsonSubtitles, 4);
    isclicked = true;
  } else {
    restartTimeline();
  }
});

function stopTimeline() {
  stopTimelineRenderer = true;
  if (timelineFrameId !== null) {
    cancelAnimationFrame(timelineFrameId);
    cancelAnimationFrame(pr_ms_FrameID);
    timelineFrameId = null;
    pr_ms_FrameID = null;
  }
}

function restartTimeline() {
  stopTimeline();
  playAu();
  timelineRenderer(jsonSubtitles, 4);
  stopTimelineRenderer = false;
}

window.restartTimelineRenderer = restartTimeline;
document.getElementById("transcriptInput")?.addEventListener("change", handleTranscriptUpload);
document.getElementById("audioInput")?.addEventListener("change", handleAudioUpload);
