// Shared type definitions used across the app.
// These describe the exact same shapes the original JS code passed around
// at runtime — nothing here changes behavior, it just names it.

export interface SubtitleEntry {
  id?: number;
  start: number; // ms
  end: number; // ms
  text: string;
}

export interface WordEntry {
  text: string;
  start: number; // ms
  end: number; // ms
}

export interface SubtitleStyleOptions {
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  fontStyle: string;
  font: string;
  fillStyle: string;
  strokeStyle: string;
  lineWidth: number;
  shadowBlur: number;
  shadowColor: string;
  shadowOffsetX: number;
  shadowOffsetY: number;
  textAlign: CanvasTextAlign;
  rotation: string;
  scale: string;
  opacity: string;
  backgroundColor?: string;
}

export interface CanvasTextProperties {
  English_fonts: string[];
  Hindi_fonts: string[];
  fontStyle: string[];
  fontSize: number[];
  color: string[];
  strokeColor: string[];
  strokeWidth: number[];
  shadowColor: string[];
  shadowBlur: number[];
  shadowOffsetX: number[];
  shadowOffsetY: number[];
  backgroundColor: string[];
  textAlign: string[];
  rotation: number[];
  scale: number[];
  opacity: number[];
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Box extends Rect {
  centerX: number;
  centerY: number;
  orientation: 0 | 90;
}

export interface CachedGlyph {
  text: string;
  posx: number;
  posy: number;
  font: string;
  fillStyle: string;
  strokeStyle: string;
  lineWidth: number;
  shadowBlur: number;
  shadowColor: string;
  shadowOffsetX: number;
  shadowOffsetY: number;
  textAlign: CanvasTextAlign;
  fontFamily?: string;
  box: Box;
  fh: string;
}

// The original code hangs a couple of values off `window` so multiple
// modules (index.js / ui.js) can share them without an import cycle.
// Keeping that pattern, just typed.
declare global {
  interface Window {
    subtitleStyleOptions: SubtitleStyleOptions;
    restartTimelineRenderer?: () => void;
  }

  interface HTMLCanvasElement {
    captureStream(frameRate?: number): MediaStream;
  }

  interface HTMLMediaElement {
    mozCaptureStream?: () => MediaStream;
  }
}
