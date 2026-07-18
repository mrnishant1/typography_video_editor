import { drawTextInBox, Layout } from "./draw_dynamicText";
import type { Box, CachedGlyph, CanvasTextProperties, SubtitleEntry, SubtitleStyleOptions, WordEntry } from "./types";
import { recordFrames } from "./videorecord";

export const globalCanvasTextProperties: CanvasTextProperties = {
  fontSize: [10, 20, 30, 40, 50, 100, 150, 200, 250, 300, 350, 400],
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

  // fontWeight: ["400", "500", "600", "700", "800", "900"],
  fontStyle: ["normal", "italic"],

  color: ["#FFFFFF", "#000000", "#FFD700", "#00FFFF", "#FF6B6B", "#A0E7E5", "#FF3CAC", "#7DFFB3", "#FFA62B", "#845EC2"],
  strokeColor: ["#000000", "#FFFFFF", "transparent", "#111111", "#FF0000", "#00FF00", "#0000FF", "#FFD700"],
  strokeWidth: [0, 1, 2, 3, 4, 5, 6],
  shadowColor: ["rgba(0,0,0,0.8)", "rgba(0,0,0,0.5)", "rgba(255,255,255,0.4)", "rgba(0,0,0,0.2)", "rgba(255,0,0,0.4)", "rgba(0,255,255,0.3)", "transparent"],
  shadowBlur: [0, 2, 4, 8, 12, 16, 20, 24],
  shadowOffsetX: [-10, -8, -4, 0, 4, 8, 10, 12],
  shadowOffsetY: [-10, -8, -4, 0, 4, 8, 10, 12],
  backgroundColor: ["rgba(0,0,0,0.6)", "rgba(20,20,20,0.7)", "rgba(255,255,255,0.15)", "transparent", "rgba(255,0,100,0.3)"],
  textAlign: ["left", "center", "right"],
  rotation: [-10, -5, 0, 5, 10],
  scale: [0.9, 1.0, 1.1, 1.2],
  opacity: [0.7, 0.85, 1.0],
};

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function sentenceToWords(jsonSubtitles: SubtitleEntry[]): WordEntry[] {
  const wordSubtitles: WordEntry[] = [];
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

export function srtToJson(srtContent: string): SubtitleEntry[] {
  const lines = srtContent.trim().split("\n");
  const subtitles: Partial<SubtitleEntry>[] = [];
  let current: Partial<SubtitleEntry> = {};

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
      // start/end are stored as raw timestamp strings here and converted
      // to ms below — same two-pass approach as the original.
      (current as any).start = start;
      (current as any).end = end;
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
    subtitle.start = timestampToMs(subtitle.start as unknown as string);
    subtitle.end = timestampToMs(subtitle.end as unknown as string);
  });

  return subtitles as SubtitleEntry[];
}

function timestampToMs(timestamp: string): number {
  const [hms, millis] = timestamp.split(",");
  const [hours, minutes, seconds] = hms.split(":").map(Number);

  const out = hours * 60 * 60 * 1000 + minutes * 60 * 1000 + seconds * 1000 + Number(millis);
  return out;
}

function getCanvasDims(): { fh: number; ms: number; canvasWidth: number; canvasHeight: number } {
  const fh = Number((document.getElementsByName("fontSize")[0] as HTMLSelectElement).value);
  const ms = Number((document.getElementsByName("min_textSize")[0] as HTMLSelectElement).value);
  // Get actual canvas dimensions instead of hardcoded values
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const canvasWidth = canvas?.width || 1920;
  const canvasHeight = canvas?.height || 1080;
  return { fh, ms, canvasWidth, canvasHeight };
}
export function applyTextStyles(ctx: CanvasRenderingContext2D | null, styles: Partial<SubtitleStyleOptions>): void {
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

export function renderInstanceSubtitle(jsonSubtitles: WordEntry, char_per_line: number, ctx: CanvasRenderingContext2D | null, incomingStyles: Partial<SubtitleStyleOptions> = {}): number | null {
  let i = jsonSubtitles;
  const sentence = i.text.split(" "); //sentence but in form of array
  const renderDuration = i.end - i.start;
  let prev_timestamp: number | null = null;
  let lastStyledIndex = -1;
  const { fh, ms, canvasWidth, canvasHeight } = getCanvasDims();
  const per_line_chaching = new Map<number, CachedGlyph>(); //used for chaching char per line
  let pr_ms_FrameID: number | null = null;
  let styles: Partial<SubtitleStyleOptions> = {
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
  let layout: Layout | null = null;
  let count: number | null = null;

  function per_ms_render(timestamp: number) {
    if (!prev_timestamp) prev_timestamp = timestamp;
    const deltaTime = timestamp - prev_timestamp;

    if (!ctx) return null;
    const localProgress = Math.min(deltaTime / renderDuration, 1); // (deltaTime = timepassed) * totalTime  = localProgress b/w[0,1]
    const visibleCharsIndex = Math.min(Math.floor(sentence.length * localProgress), sentence.length - 1);

    if (visibleCharsIndex % char_per_line === 0 && visibleCharsIndex !== lastStyledIndex) {
      lastStyledIndex = visibleCharsIndex;
      per_line_chaching.clear();

      //Making parent Box Layout for next text batch
      layout = new Layout({
        x: window.LayoutX || canvasWidth * 0.1,
        y: window.LayoutY || canvasWidth * 0.1,
        width: window.LayoutWidth || canvasWidth * 0.8,
        height: window.LayoutHeight || canvasHeight * 0.8,
      });

      count = layout.fill_parentBox(Number(fh), Number(ms));

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      styles = {
        ...styles,
        ...incomingStyles,
        font: incomingStyles.font || `${incomingStyles.fontSize || 200}px ${incomingStyles.fontFamily || pickRandom(globalCanvasTextProperties.English_fonts)}`,
      };
      if (styles.fontFamily == "__random__") {
        console.log("random");
        styles.fontFamily = globalCanvasTextProperties.English_fonts[Math.floor(Math.random() * globalCanvasTextProperties.English_fonts.length)];
      }
    }

    // //Render all chached queue----------------------
    const textToDraw = sentence[Math.floor(visibleCharsIndex)];
    const textBox: Box = (layout as Layout).boxes[Math.min(visibleCharsIndex % char_per_line, count as number)];

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    if (char_per_line) {
      //==================Debugging Boundaries=====================================================

      // ctx.beginPath();
      // ctx.strokeStyle = "rgb(68, 0, 255)";
      // ctx.strokeRect(layout!.parent.x, layout!.parent.y, layout!.parent.width, layout!.parent.height);
      // ctx.stroke();
      // ctx.strokeStyle = "rgb(0, 0, 0)";
      // ctx.strokeRect(textBox.x, textBox.y, textBox.width, textBox.height);

      // console.log(layout ? "" : "fuck layout not ");
      drawTextInBox(textToDraw, ctx, textBox, fh, styles);
    }

    if (visibleCharsIndex !== lastStyledIndex) {
      per_line_chaching.forEach((cachedStyle, cachedIndex) => {
        if (cachedIndex === visibleCharsIndex) return;
        drawTextInBox(cachedStyle.text, ctx, cachedStyle.box, cachedStyle.fh, cachedStyle);
      });
      //On change in index reset x
    }

    per_line_chaching.set(visibleCharsIndex, {
      text: sentence[Math.floor(visibleCharsIndex)],
      posx: textBox.x,
      posy: textBox.y,
      font: styles.font as string,
      fillStyle: styles.fillStyle as string,
      strokeStyle: styles.strokeStyle as string,
      lineWidth: styles.lineWidth as number,
      shadowBlur: styles.shadowBlur as number,
      shadowColor: styles.shadowColor as string,
      shadowOffsetX: styles.shadowOffsetX as number,
      shadowOffsetY: styles.shadowOffsetY as number,
      textAlign: styles.textAlign as CanvasTextAlign,
      fontFamily: incomingStyles.fontFamily,
      box: textBox,
      fh: fh,
    });

    if (localProgress < 1) {
      pr_ms_FrameID = requestAnimationFrame(per_ms_render);
    }
  }

  pr_ms_FrameID = requestAnimationFrame(per_ms_render);
  return pr_ms_FrameID;
}
export function getWordsPerRender(): number {
  return parseInt((document.getElementsByName("Word_per_render")[0] as HTMLSelectElement)?.value, 10) || 4;
}

export function recordingVideo(canvas: HTMLCanvasElement, time: number, audio?:HTMLAudioElement | number | null): void {
  const recording = recordFrames(canvas, time);

  // play it on another video element
  var video$ = document.createElement("video");
  document.body.appendChild(video$);
  recording.then((url) => video$.setAttribute("src", url));

  // download it
  var link$ = document.createElement("a");
  link$.innerText = "download";
  const ext = MediaRecorder.isTypeSupported("video/mp4") ? "mp4" : "webm";
  link$.setAttribute("download", `recordingVideo.${ext}`);
  recording.then((url) => {
    link$.setAttribute("href", url);
    link$.click();
  });
}
