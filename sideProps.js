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

export function renderInstanceSubtitle(jsonSubtitles, char_per_line, ctx) {
  let i = jsonSubtitles;
  const sentence = i.text.split(" "); //sentence but in form of array
  const renderDuration = i.end - i.start;

  let prev_timestamp = null;
  let lastStyledIndex = -1;
  let fontSize = 200;

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

    // const textToDraw = sentence
    //   .slice(
    //     Math.floor(visibleCharsIndex / char_per_line),
    //     Math.floor(visibleCharsIndex / char_per_line) + char_per_line,
    //   )
    //   .join(" ");
    let positionAlongX = (visibleCharsIndex % char_per_line) * 300;
    if (
      visibleCharsIndex % char_per_line === 0 &&
      visibleCharsIndex !== lastStyledIndex
    ) {
      lastStyledIndex = visibleCharsIndex;
      console.log("HIii", visibleCharsIndex);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${fontSize}px`.concat(
        globalCanvasTextProperties.English_fonts[
          Math.floor(Math.random() * 20)
        ],
      );

      ctx.fillStyle = "#00ffea";
      ctx.shadowBlur = 10;
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.textAlign = "left";
    }
    const textToDraw = sentence[Math.floor(visibleCharsIndex)];

    // ctx.clearRect(0, 0, canvas.width, canvas.height);
    const metrics = ctx.measureText(textToDraw);

    // 1. Actual rendered pixel height of the specific string
    const actualHeight =
      metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

    // 2. Font bounding box height (the entire height of the font container)
    const fontHeight =
      metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;

    // console.log((visibleCharsIndex % char_per_line) - char_per_line / 2);

    ctx.fillText(
      textToDraw,
      canvas.width / 2.5 +
        ((visibleCharsIndex % char_per_line) - char_per_line / 2) *
          localProgress *
          200,
      canvas.height / 2 + actualHeight*2,
    );
    if (localProgress < 1) {
      requestAnimationFrame(countDownTimer);
    }
  }
  requestAnimationFrame(countDownTimer);
}

// Generate one random style object ----
export function generateRandomWordStyle(config) {
  const style = {};
  for (const key in config) {
    style[key] = pickRandom(config[key]);
  }
  return style;
}

//  Generate styles array, one per word ----
export function generateWordStyles(words, config) {
  return words.map(() => generateRandomWordStyle(config));
}
