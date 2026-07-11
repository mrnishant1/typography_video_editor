const canvas = document.getElementById("canvas");
import {
  globalCanvasTextProperties,
  renderInstanceSubtitle,
  sentenceToWords,
  srtToJson,
} from "./sideProps.js";
import { pickRandom } from "./sideProps.js";
const font = new FontFace(
  "MyFont",
  "url('lavish.ttf')"
);

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
// const transcript = `﻿1
// 00:00:01,360 --> 00:00:04,510
// "अरे क्या यार तू ये daily, daily यही किताब
// क्यों पढ़ता रहता है?

// 2
// 00:00:04,839 --> 00:00:09,680
// क्या मजा आता है तुझे यही किताब पढ़ने
// में?" मेरे दोस्त ने मुझसे पूछा। मैं

// 3
// 00:00:09,760 --> 00:00:13,659
// मुस्कुराया और हँसी में टाल दिया। क्यों
// नहीं समझाया उसे?

// 4
// 00:00:14,659 --> 00:00:20,579
// क्या समझाता मैं उसे? कैसे बोलता मैं उसे
// जो बात मैं खुद शब्दों

// 5
// 00:00:20,659 --> 00:00:23,840
// में बयां नहीं कर पाता, वो बातें मैं कैसे
// समझाता?

// 6
// 00:00:25,019 --> 00:00:30,719
// कैसे समझाता मैं उसे वो गहराव? कैसे समझाता
// मैं उस-- उन किरदारों की

// 7
// 00:00:30,799 --> 00:00:36,499
// चुप्पी जो हजार बातों से भी गहरी होती है।
// किरदारों का घंटों तक बिना एक

// 8
// 00:00:36,779 --> 00:00:42,540
// भी शब्द कहे बैठे रहना। कहां इन दुनिया की
// दौड़ भरी जिंदगी में

// 9
// 00:00:42,639 --> 00:00:48,319
// किसी को समझ आएगा। जो किताबें बचपन में किस
// से कहानियां लगती थी,

// 10
// 00:00:48,759 --> 00:00:54,519
// वो आज अपने ही जीवन का पहलू लगती हैं। उन
// पहलू का अपने आप को किरदार पाता हूं मैं।

// 11
// 00:00:54,599 --> 00:00:59,879
// जैसे वो मेरे से ही बात कर रही हैं। उनको
// पढ़कर मैं अपने आप को पाता हूं।

// 12
// 00:01:00,000 --> 00:01:04,998
// खैर, मैंने बोला कि ये बात करती हैं। वो
// हंस

// 13
// 00:01:05,080 --> 00:01:08,912
// दिया। शायद समझा, शायद नहीं।`;

const transcript = `1
00:00:01,000 --> 00:00:03,500
Welcome back, everyone! Today we are
going to dive into a fascinating topic.

2
00:00:03,800 --> 00:00:07,100
Have you ever wondered how artificial
intelligence is changing our daily lives?

3
00:00:07,500 --> 00:00:10,200
It’s not just about robots anymore;
it's about the algorithms working

4
00:00:10,200 --> 00:00:11,900
behind the scenes.

5
00:00:12,200 --> 00:00:15,600
Let's explore some of the most exciting
advancements we've seen recently.

6
00:00:16,000 --> 00:00:18,500
First, we are seeing massive
improvements in natural language processing.

7
00:00:18,800 --> 00:00:22,300
Machines are getting much better at
understanding context and subtle human humor.

8
00:00:22,700 --> 00:00:25,900
Second, automation is streamlining
workflows in almost every industry.

9
00:00:26,200 --> 00:00:30,000
Whether it is in healthcare, finance, or
education, the impact is undeniable.

10
00:00:30,400 --> 00:00:33,000
But what does this mean for our
future jobs and daily routines?

11
00:00:33,400 --> 00:00:35,900
Many experts believe we will need
to adapt and learn new skills.

12
00:00:36,300 --> 00:00:38,600
Lifelong learning will become more
important than ever before.

13
00:00:39,000 --> 00:00:41,200
Thank you so much for watching,
and I will see you in the next video!
`

const jsonSubtitles = srtToJson(transcript);
// console.log(jsonSubtitles);

const wordJsonSub = sentenceToWords(jsonSubtitles);

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

      renderInstanceSubtitle(currentSubtitle, char_per_line, ctx);
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
  // timelineRenderer(wordJsonSub);
}
timelineRenderer(jsonSubtitles, 4);

let isclicked = false;
document.getElementById("play").addEventListener("click", () => {
  if (!isclicked) {
    playAu(isclicked);
  }
  isclicked = true;
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
