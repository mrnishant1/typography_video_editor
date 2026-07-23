// ---------- Core algorithm ----------
// Free-space is tracked as a LIST of real rectangles, not a single scalar.
// Every placement removes one free rect, places a box in its top-left corner,
// then splits the leftover into up to two new free rects (guillotine cut).

import { applyTextStyles } from "./used_functions";
import type { Box, Rect, SubtitleStyleOptions, Timeline } from "./types";

export class Layout {
  parent: Rect;
  freeRects: Rect[];
  boxes: Box[];

  constructor(parentRect: Rect) {
    // parentRect: {x, y, width, height}  (x,y = top-left)
    this.parent = parentRect;
    this.freeRects = [{ ...parentRect }];
    this.boxes = [];
  }

  // Pick the largest-area usable free rect to place into.
  _pickFreeRectIndex(minSize: number): number {
    let bestIdx = -1;
    let bestArea = -1;
    for (let i = 0; i < this.freeRects.length; i++) {
      const r = this.freeRects[i];
      if (r.width < minSize || r.height < minSize) continue;
      const area = r.width * r.height;
      if (area > bestArea) {
        bestArea = area;
        bestIdx = i;
      }
    }
    return bestIdx;
  }

  placeBox(fontHeight: number, minSize: number): Box | null {
    const idx = this._pickFreeRectIndex(minSize);
    if (idx === -1) return null;

    const rect = this.freeRects.splice(idx, 1)[0];

    // const orientation = Math.random() < 0.7 ? 0 : 90;
    const orientation: 0 | 90 = 0;
    let width: number, height: number;

    if (orientation === 0) {
      // "horizontal text": height capped by font size, width varies
      height = Math.min(fontHeight, rect.height);
      width = Math.min(rect.width, Math.max(minSize, Math.random() * rect.width));
    } else {
      // "vertical text": width capped by font size, height varies
      width = Math.min(fontHeight, rect.width);
      height = Math.min(rect.height, Math.max(minSize, Math.random() * rect.height));
    }

    const box: Box = {
      x: rect.x,
      y: rect.y,
      width,
      height,
      centerX: rect.x + width / 2,
      centerY: rect.y + height / 2,
      orientation,
    };
    this.boxes.push(box);

    // Guillotine split of the leftover space into up to two rectangles:
    // 1) a strip to the right of the box, spanning the full height of the original free rect
    // 2) a strip below the box, spanning only the box's width
    const rightRect: Rect = {
      x: rect.x + width,
      y: rect.y,
      width: rect.width - width,
      height: rect.height,
    };
    const bottomRect: Rect = {
      x: rect.x,
      y: rect.y + height,
      width: width,
      height: rect.height - height,
    };

    if (rightRect.width > 0 && rightRect.height > 0) this.freeRects.push(rightRect);
    if (bottomRect.width > 0 && bottomRect.height > 0) this.freeRects.push(bottomRect);

    return box;
  }

  fill_parentBox(fontHeight: number, minSize: number, maxBoxes = 2000): number {
    let count = 0;
    while (count < maxBoxes) {
      const box = this.placeBox(fontHeight, minSize);
      if (!box) break;
      count++;
    }
    return count;
  }
}

// ---------- Rendering ----------

// Binary-search the largest font size (up to maxHeight) whose rendered text
// width still fits within maxWidth. Returns 0 if even size 1 doesn't fit.
function fitFontSize(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxHeight: number): number {
  let lo = 1;
  let hi = Math.floor(maxHeight);
  if (hi < 1) return 0;

  let best = 0;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    ctx.font = `${mid}px sans-serif`;
    const width = ctx.measureText(text).width;
    if (width <= maxWidth) {
      best = mid; // this size fits, try a bigger one
      lo = mid + 1;
    } else {
      hi = mid - 1; // too wide, try smaller
    }
  }
  return best;
}

export class Custom_Layouts {
  boxes: Box[];
  timeLine: Timeline;
  box_count: number;
  LayoutName: string;

  constructor(layoutName: string, boxes: Box[], { time_start, time_end }: { time_start: number; time_end: number }) {
    this.LayoutName = layoutName;
    this.boxes = boxes;
    this.timeLine = {
      start: time_start,
      end: time_end,
    };
    this.box_count = this.boxes.length || 0;
  }

  fill_parentBox(fh: number, ms: number) {
    return this.boxes.length;
  }
}

export function drawTextInBox(
  text: string,
  ctx: CanvasRenderingContext2D | null,
  box: Box | null,
  fontHeight: string | number,
  styles: Partial<SubtitleStyleOptions> = window.subtitleStyleOptions || {},
): void {
  const padding = 0;
  if (!text || !ctx || !box || !fontHeight) {
    console.log("mising prop", text, ctx, box, fontHeight);
    return;
  }

  // For orientation 0, text runs along box.width and is capped by box.height.
  // For orientation 90, text runs along box.height (post-rotation) and is
  // capped by box.width. Either way, font size never exceeds fontHeight.
  const availableLength = box.orientation === 0 ? box.width - padding : box.height - padding;
  const availableThickness = Math.min(Number(fontHeight), box.orientation === 0 ? box.height : box.width) - padding;

  const fontSize = fitFontSize(ctx, text, availableLength, availableThickness);
  if (fontSize < 1) return; // Guard against 0px rendering

  ctx.save(); // Save at function entry

  // Apply the same fitted font, position, and styles to both drawing calls.
  // Calling strokeText outside this function would use a different baseline/font.
  applyTextStyles(ctx, styles);
  let fontFamily = styles.fontFamily || styles.font?.replace(/^[\d.]+px\s+/, "") || "sans-serif";
  ctx.font = `${fontSize}px ${fontFamily}`;

  ctx.textBaseline = "middle";

  if (box.orientation === 0) {
    ctx.textAlign = "left";

    const x = box.x + padding;
    const y = box.y + box.height / 2;

    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
  } else {
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    ctx.textAlign = "center";
    ctx.translate(centerX, centerY);
    ctx.rotate(Math.PI / 2);

    ctx.strokeText(text, 0, 0);
    ctx.fillText(text, 0, 0);
  }
  ctx.restore(); // Single balanced restore
}
