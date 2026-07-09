const canvas = document.getElementById("canvas");
console.log(canvas);
let ctx = null;
if (canvas) {
  canvas.height = 1080;
  canvas.width = 1920;
  ctx = canvas.getContext("2d");
}
//=======================Load Transcript============================
const transcript = `﻿1
00:00:01,360 --> 00:00:04,510
"अरे क्या यार तू ये daily, daily यही किताब
क्यों पढ़ता रहता है?

2
00:00:04,839 --> 00:00:09,680
क्या मजा आता है तुझे यही किताब पढ़ने
में?" मेरे दोस्त ने मुझसे पूछा। मैं

3
00:00:09,760 --> 00:00:13,659
मुस्कुराया और हँसी में टाल दिया। क्यों
नहीं समझाया उसे?

4
00:00:14,659 --> 00:00:20,579
क्या समझाता मैं उसे? कैसे बोलता मैं उसे
जो बात मैं खुद शब्दों

5
00:00:20,659 --> 00:00:23,840
में बयां नहीं कर पाता, वो बातें मैं कैसे
समझाता?

6
00:00:25,019 --> 00:00:30,719
कैसे समझाता मैं उसे वो गहराव? कैसे समझाता
मैं उस-- उन किरदारों की

7
00:00:30,799 --> 00:00:36,499
चुप्पी जो हजार बातों से भी गहरी होती है।
किरदारों का घंटों तक बिना एक

8
00:00:36,779 --> 00:00:42,540
भी शब्द कहे बैठे रहना। कहां इन दुनिया की
दौड़ भरी जिंदगी में

9
00:00:42,639 --> 00:00:48,319
किसी को समझ आएगा। जो किताबें बचपन में किस
से कहानियां लगती थी,

10
00:00:48,759 --> 00:00:54,519
वो आज अपने ही जीवन का पहलू लगती हैं। उन
पहलू का अपने आप को किरदार पाता हूं मैं।

11
00:00:54,599 --> 00:00:59,879
जैसे वो मेरे से ही बात कर रही हैं। उनको
पढ़कर मैं अपने आप को पाता हूं।

12
00:01:00,000 --> 00:01:04,998
खैर, मैंने बोला कि ये बात करती हैं। वो
हंस

13
00:01:05,080 --> 00:01:08,912
दिया। शायद समझा, शायद नहीं।`;

// const speech = [
//   { start: 0.2, end: 4.5 },
//   { start: 4.8, end: 8.7 },
//   { start: 8.9, end: 11.3 },
//   { start: 11.6, end: 13.0 },
//   { start: 14.0, end: 15.1 },
//   { start: 15.4, end: 19.7 },
//   { start: 21.0, end: 22.9 },
//   { start: 23.1, end: 26.8 },
//   { start: 27.6, end: 28.5 },
//   { start: 29.2, end: 29.9 },
//   { start: 30.2, end: 32.7 },
//   { start: 32.9, end: 34.3 },
//   { start: 34.4, end: 35.3 },
//   { start: 35.5, end: 36.8 },
//   { start: 37.3, end: 38.0 },
//   { start: 38.5, end: 39.5 },
//   { start: 40.1, end: 42.5 },
//   { start: 42.7, end: 48.5 },
//   { start: 50.3, end: 59.0 },
//   { start: 59.4, end: 60.4 },
//   { start: 60.9, end: 64.3 },
//   { start: 64.6, end: 66.0 },
//   { start: 67.8, end: 69.7 },
//   { start: 75.4, end: 79.2 },
//   { start: 79.8, end: 83.5 },
//   { start: 84.0, end: 84.6 },
//   { start: 84.8, end: 86.0 },
//   { start: 87.2, end: 88.4 },
//   { start: 88.5, end: 90.6 },
//   { start: 90.8, end: 92.6 },
//   { start: 93.2, end: 97.8 },
//   { start: 98.3, end: 99.4 },
//   { start: 99.5, end: 102.4 },
//   { start: 102.7, end: 108.2 },
//   { start: 109.3, end: 112.5 },
//   { start: 115.4, end: 124.2 },
//   { start: 124.3, end: 131.7 },
//   { start: 132.1, end: 136.1 },
//   { start: 136.4, end: 137.2 },
//   { start: 137.7, end: 138.7 },
//   { start: 139.0, end: 139.7 },
//   { start: 140.8, end: 144.7 },
//   { start: 145.1, end: 147.0 },
//   { start: 147.2, end: 147.9 },
//   { start: 148.9, end: 149.9 },
//   { start: 150.1, end: 154.9 },
//   { start: 155.2, end: 155.6 },
//   { start: 156.1, end: 157.5 },
//   { start: 157.7, end: 158.7 },
//   { start: 160.4, end: 161.2 },
//   { start: 162.9, end: 166.7 },
//   { start: 167.0, end: 168.0 },
//   { start: 168.9, end: 171.0 },
//   { start: 171.5, end: 175.2 },
// ];

function srtToJson(srtContent) {
  const lines = srtContent.trim().split("\n");
  const subtitles = [];
  let current = {};

  for (let line of lines) {
    line = line.trim();

    if (!line) {
      if (Object.keys(current).length > 0) {
        subtitles.push(current);
        current = {};
      }
      continue;
    }

    if (/^\d+$/.test(line)) {
      current.id = parseInt(line);
    } else if (line.includes("-->")) {
      const [start, end] = line.split("-->").map((t) => t.trim());
      current.start = start;
      current.end = end;
    } else {
      if (!current.text) {
        current.text = "";
      }
      current.text += (current.text ? " " : "") + line;
    }
  }

  if (Object.keys(current).length > 0) {
    subtitles.push(current);
  }
  subtitles.forEach((subtitle) => {
    subtitle.start = timestampToMs(subtitle.start);
    subtitle.end = timestampToMs(subtitle.end);
  });

  return subtitles;
}
function timestampToMs(timestamp) {
  const [hms, millis] = timestamp.split(",");
  const [hours, minutes, seconds] = hms.split(":").map(Number);

  const out =
    hours * 60 * 60 * 1000 +
    minutes * 60 * 1000 +
    seconds * 1000 +
    Number(millis);
  return out;
}

const jsonSubtitles = srtToJson(transcript);
console.log(jsonSubtitles);

function sentenceToWords(jsonSubtitles) {
  const wordSubtitles = [];
  jsonSubtitles.forEach((subtitle) => {
    const words = subtitle.text.split(" ");
    const totalChars = subtitle.text.length;
    const totalDuration = subtitle.end - subtitle.start;

    let previousWordEnd = subtitle.start;

    words.forEach((word) => {
      const wordDuration = (word.length / totalChars) * totalDuration;
      const wordStart = previousWordEnd;
      const wordEnd = wordStart + wordDuration;

      wordSubtitles.push({
        text: word,
        start: wordStart,
        end: wordEnd,
      });

      previousWordEnd = wordEnd;
    });
  });
  return wordSubtitles;
}

const wordJsonSub = sentenceToWords(jsonSubtitles)

//================Sentence Renderer================================
function renderInstanceSubtitle(jsonSubtitles, char_per_line) {
  let i = jsonSubtitles;
  const sentence = i.text.split(" ");
  const renderDuration = i.end - i.start;

  let prev_timestamp = null;
  function countDownTimer(timestamp) {
    if (!prev_timestamp) prev_timestamp = timestamp;
    const deltaTime = timestamp - prev_timestamp;

    if (!ctx) return;
    const localProgress = Math.min(deltaTime / renderDuration, 1); // (deltaTime = timepassed) * totalTime  = localProgress b/w[0,1]
    const visibleCharsIndex = Math.min(
      Math.floor(sentence.length * localProgress),
      sentence.length - 1,
    );
    // console.log("visible char", visibleCharsIndex);

    const textToDraw = sentence
      .slice(
        Math.floor(visibleCharsIndex / char_per_line),
        Math.floor(visibleCharsIndex / char_per_line) + char_per_line,
      )
      .join(" ");

    //Text Properties====
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "100px Arial";
    ctx.fillStyle = "#000000";
    ctx.textAlign = "left";
    ctx.fillText(textToDraw, canvas.width / 2, canvas.height / 2);

    if (localProgress < 1) {
      requestAnimationFrame(countDownTimer);
    }
  }
  requestAnimationFrame(countDownTimer);
}

//===================Timeline HTML=================================
const timelineStarting = 0;
const audioTimeline = jsonSubtitles[jsonSubtitles.length - 1].end;

const time_content = document.getElementById("time_content");
time_content.innerHTML = `<div id="timeline_progress" style="z-index:1"></div>
  <div id="subtitle_in_timeline" style="position: relative; height:100px"></div>
  `;
const subtitle_in_timeline = document.getElementById("subtitle_in_timeline");
if (subtitle_in_timeline) {
  const blocks = jsonSubtitles.map((element) => {
    const start = (element.start / audioTimeline) * time_content.offsetWidth;
    const end = (element.end / audioTimeline) * time_content.offsetWidth;
    const width = end - start;
    return `<div id="subtitle" style="position:absolute; left:${start}px; width:${width}px; height:100%; background:rgba(255, 0, 0, 0.38); color:white; font-size:14px; overflow:hidden;
       text-overflow:ellipsis; white-space:nowrap; box-sizing:border-box; padding:2px 4px;">${element.text}</div>`;
  });
  subtitle_in_timeline.innerHTML = blocks.join("");
}

//===================Timeline Renderer=================================
function timelineRenderer(
  jsonSubtitles,
  timelineLength = audioTimeline,
  char_per_line = 1,
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
    // console.log("deltaTime", Math.floor(deltaTime / 1000));

    //when deltaTime == Subtitle start render it till delta time == subtitle
    //else render nothing
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

      renderInstanceSubtitle(currentSubtitle, char_per_line);
      renderedSubtitle = current_subtitle;
    }

    if (globalTimelineProgress < 1) {
      requestAnimationFrame(renderer);
    } else {
      globalTimelineProgress = 1;
    }
    // renderInstanceSubtitle(jsonSubtitles[0])
  }
  requestAnimationFrame(renderer);
}

//================audio player================================
function playAu() {
  const a = new Audio("./diary.m4a");
  a.play();
  timelineRenderer(jsonSubtitles);
}
document.getElementById("play").addEventListener("click", () => {
  playAu();
});

// if (time_content) {
//   time_content.addEventListener('click', (e) => {
//     const rect = time_content.getBoundingClientRect();
//     const time_contentWidth = rect.width;
//     const clickX = e.clientX - rect.left;
//     const relativeClick = clickX / time_contentWidth;

//     console.log("time_content inner width:", time_contentWidth);
//     console.log("click x relative to rect width:", relativeClick);
//   });
// }
