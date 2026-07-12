export const globalCanvasTextProperties = {
  English_fonts: [
    "'Akronim'",
    "'Bangers'",
    "'Bungee'",
    "'Carter One'",
    "'Chango'",
    "'Coiny'",
    "'Creepster'",
    "'Fascinate Inline'",
    "'Fredericka the Great'",
    "'Henny Penny'",
    "'Honk'",
    "'Kablammo'",
    "'Kavoon'",
    "'Lilita One'",
    "'Luckiest Guy'",
    "'Mrs Sheppards'",
    "'Nabla'",
    "'Notable'",
    "'Oi'",
    "'Ruge Boogie'",
    "'Titan One'",
    "'Ultra'",
  ],
  Hindi_fonts: [
    "60px 'Anek Devanagari'",
    "60px 'Amita'",
    "60px 'Arya'",
    "60px 'Baloo 2'",
    "60px 'Cambay'",
    "60px 'Dekko'",
    "60px 'Eczar'",
    "60px 'Glegoo'",
    "60px 'Gotu'",
    "60px 'Hind'",
    "60px 'Kalam'",
    "60px 'Karma'",
    "60px 'Khand'",
    "60px 'Kurale'",
    "60px 'Laila'",
    "60px 'Martel'",
    "60px 'Martel Sans'",
    "60px 'Modak'",
    "60px 'Mukta'",
    "60px 'Noto Sans Devanagari'",
    "60px 'Palanquin'",
    "60px 'Rajdhani'",
    "60px 'Ranga'",
    "60px 'Rozha One'",
    "60px 'Sarala'",
    "60px 'Sarpanch'",
    "60px 'Teko'",
    "60px 'Tillana'",
    "60px 'Tiro Devanagari Hindi'",
    "60px 'Yatra One'",
  ],

  fontWeight: ["400", "500", "600", "700", "800", "900"],
  fontStyle: ["normal", "italic"],
  fontSize: [36, 42, 48, 56, 64, 72, 80, 96],
  color: [
    "#FFFFFF",
    "#000000",
    "#FFD700",
    "#00FFFF",
    "#FF6B6B",
    "#A0E7E5",
    "#FF3CAC",
    "#7DFFB3",
    "#FFA62B",
    "#845EC2",
  ],
  strokeColor: ["#000000", "#FFFFFF", "transparent", "#111111"],
  strokeWidth: [0, 1, 2, 3, 4],
  shadowColor: [
    "rgba(0,0,0,0.8)",
    "rgba(0,0,0,0.5)",
    "rgba(255,255,255,0.4)",
    "transparent",
  ],
  shadowBlur: [0, 4, 8, 12, 20],
  shadowOffsetX: [-4, -2, 0, 2, 4],
  shadowOffsetY: [-4, -2, 0, 2, 4],
  backgroundColor: [
    "rgba(0,0,0,0.6)",
    "rgba(20,20,20,0.7)",
    "rgba(255,255,255,0.15)",
    "transparent",
    "rgba(255,0,100,0.3)",
  ],
  textAlign: ["left", "center", "right"],
  rotation: [-10, -5, 0, 5, 10],
  scale: [0.9, 1.0, 1.1, 1.2],
  opacity: [0.7, 0.85, 1.0],
};
export function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function sentenceToWords(jsonSubtitles) {
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

export function srtToJson(srtContent) {
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

function applyTextStyles(ctx, styles) {
  if (!ctx) return;
  ctx.save();
  ctx.font = styles.font || "";
  ctx.fillStyle = styles.fillStyle || "#000000";
  ctx.strokeStyle = styles.strokeStyle || "transparent";
  ctx.lineWidth = styles.lineWidth || 0;
  ctx.shadowBlur = styles.shadowBlur || 0;
  ctx.shadowColor = styles.shadowColor || "rgba(0, 0, 0, 0)";
  ctx.shadowOffsetX = styles.shadowOffsetX || 0;
  ctx.shadowOffsetY = styles.shadowOffsetY || 0;
  ctx.textAlign = styles.textAlign || "left";
}

export function renderInstanceSubtitle(
  jsonSubtitles,
  char_per_line,
  ctx,
  incomingStyles = {},
) {
  
  let i = jsonSubtitles;
  const sentence = i.text.split(" "); //sentence but in form of array
  const renderDuration = i.end - i.start;
  let prev_timestamp = null;
  let lastStyledIndex = -1;
  const canvasWidth = ctx?.canvas?.width || 1920;
  const canvasHeight = ctx?.canvas?.height || 1080;
  const per_line_chaching = new Map(); //used for chaching char per line
  let pr_ms_FrameID = null;
  let styles = {
    font: incomingStyles.font || `${incomingStyles.fontSize || 200}px ${incomingStyles.fontFamily || pickRandom(globalCanvasTextProperties.English_fonts)}`,
    fillStyle: incomingStyles.fillStyle || "#4800ff",
    strokeStyle: incomingStyles.strokeStyle || "#000000",
    lineWidth: incomingStyles.lineWidth || 2,
    shadowBlur: incomingStyles.shadowBlur || 10,
    shadowColor: incomingStyles.shadowColor || "rgba(0, 0, 0, 0.96)",
    shadowOffsetX: incomingStyles.shadowOffsetX || 10,
    shadowOffsetY: incomingStyles.shadowOffsetY || 10,
    textAlign: incomingStyles.textAlign || "left",
  };
  let lastPushedIndex = -1;
  let bigWordIndex = -1;

  function per_ms_render(timestamp) {

    if (!prev_timestamp) prev_timestamp = timestamp;
    const deltaTime = timestamp - prev_timestamp;

    if (!ctx) return null;
    const localProgress = Math.min(deltaTime / renderDuration, 1); // (deltaTime = timepassed) * totalTime  = localProgress b/w[0,1]
    const visibleCharsIndex = Math.min(
      Math.floor(sentence.length * localProgress),
      sentence.length - 1,
    );
    let x =
      canvasWidth / 2.5 +
      (visibleCharsIndex % 2 === 0 ? 1 : -1 * deltaTime) / 4;

    let y =
      (((2.3 / 4) * canvasHeight) / char_per_line) *
        (visibleCharsIndex % char_per_line) +
      200;
  

    if (
      visibleCharsIndex % char_per_line === 0 &&
      visibleCharsIndex !== lastStyledIndex
    ) {
      lastStyledIndex = visibleCharsIndex;
      per_line_chaching.clear();
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      styles = {
        ...styles,
        ...incomingStyles,
        font: incomingStyles.font || `${incomingStyles.fontSize || 200}px ${incomingStyles.fontFamily || pickRandom(globalCanvasTextProperties.English_fonts)}`,
      };
    }

    // //Render all chached queue----------------------
    const textToDraw = sentence[Math.floor(visibleCharsIndex)];

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Render paper.jpg as background
    const bgImage = new Image();
    bgImage.src = "./paper.jpg";
    ctx.drawImage(bgImage, 0, 0, canvasWidth, canvasHeight);
    // bgImage.onload = () => {
    // };

    // x = SlideIn(visibleCharsIndex, deltaTime, char_per_line, {
    //   start: canvas.width / 2,
    // });
    if (char_per_line) {
      applyTextStyles(ctx, styles);
      ctx.strokeText(textToDraw, x, y);
      ctx.fillText(textToDraw, x, y);
      ctx.restore();
    }

    if (visibleCharsIndex !== lastStyledIndex) {
      per_line_chaching.forEach((cachedStyle, cachedIndex) => {
        if (cachedIndex === visibleCharsIndex) return;
        applyTextStyles(ctx, cachedStyle);
        ctx.strokeText(cachedStyle.text, cachedStyle.posx, cachedStyle.posy);
        ctx.fillText(cachedStyle.text, cachedStyle.posx, cachedStyle.posy);
        ctx.restore();
      });
      //On change in index reset x
    }

    per_line_chaching.set(visibleCharsIndex, {
      text: sentence[Math.floor(visibleCharsIndex)],
      posx: x,
      posy: y,
      font: styles.font,
      fillStyle: styles.fillStyle,
      strokeStyle: styles.strokeStyle,
      lineWidth: styles.lineWidth,
      shadowBlur: styles.shadowBlur,
      shadowColor: styles.shadowColor,
      shadowOffsetX: styles.shadowOffsetX,
      shadowOffsetY: styles.shadowOffsetY,
      textAlign: styles.textAlign,
    });

    if (localProgress < 1) {
      pr_ms_FrameID = requestAnimationFrame(per_ms_render);
    }
  }
  
  pr_ms_FrameID = requestAnimationFrame(per_ms_render);
  return pr_ms_FrameID;
}
