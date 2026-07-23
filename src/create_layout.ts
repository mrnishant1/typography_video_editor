import { Custom_Layouts, drawTextInBox } from "./draw_dynamicText";
import { Box } from "./types";
export const Custom_layouts: Custom_Layouts[] = [];

const button = document.getElementById("create_custom_layout");
const closebutton = document.getElementById("close_layout_creator");
const create_new_layout = document.getElementById("create_layout");
const panel = document.getElementById("customCanvasContainer");
if (button && panel && closebutton) {
  button.addEventListener("click", function (event) {
    event.preventDefault();
    const isCollapsed = panel.style.transform === "translateX(-100%)";
    panel.style.transform = isCollapsed ? "translateX(0)" : "translateX(-100%)";
  });
  closebutton.addEventListener("click", function (event) {
    event.preventDefault();
    const isCollapsed = panel.style.transform === "translateX(-100%)";
    panel.style.transform = isCollapsed ? "translateX(0)" : "translateX(-100%)";
  });
}

let canvas = document.getElementById("custom_canvas") as HTMLCanvasElement;
let ctx: CanvasRenderingContext2D | null = canvas.getContext("2d");
canvas.width = 1920;
canvas.height = 1080;

if (canvas) {
  let isMouseDown = false;
  let startX = 0;
  let startY = 0;
  let pos = null;
  let x: number | null = null;
  let y: number | null = null;
  let width: null | number = null;
  let height: null | number = null;
  const save_layout = document.getElementById("save_layout");
  let isLayout_Saved = false;
  let Boxes: Box[] = [];

  //==========Save Layout==========================
  const saveLayoutBtn = document.getElementById("save_layout");
  const savedLayouts = document.getElementById("saved_layouts");
  const clearLayouts = document.getElementById("clear_layout");

  saveLayoutBtn?.addEventListener("click", () => {
    const layoutNameInput = document.getElementById("layout_name") as HTMLInputElement;
    const layoutName = layoutNameInput.value.trim();

    if (!isLayout_Saved && layoutName && Boxes.length >= 1) {
      Custom_layouts.push(
        new Custom_Layouts(layoutName, Boxes, {
          time_start: 0,
          time_end: window.GlobalTimeline || 0,
        }),
      );

      // Create the layout item
      const layoutDiv = document.createElement("div");
      layoutDiv.className = "saved-layout";
      layoutDiv.textContent = layoutName;

      savedLayouts?.appendChild(layoutDiv);

      layoutNameInput.value = "";
      isLayout_Saved = true;
      Boxes = [];
    } else {
      console.log("no name or no layout created");
    }
  });

  //==========Create New Layout==========================
  clearLayouts?.addEventListener("click", () => {
    if (!isLayout_Saved && Boxes.length >= 1) {
      const keepExisting = confirm("Do you want to keep the existing layout?");
      if (keepExisting) {
        return;
      }
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    Boxes = [];
    isLayout_Saved = false;
  });

  //==========Create New Layout==========================
  if (create_new_layout) {
    create_new_layout.addEventListener("click", () => {
      if (!isLayout_Saved) {
        const keepExisting = confirm("Do you want to keep the existing layout?");
        if (keepExisting) {
          return;
        }
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      Boxes = [];
      isLayout_Saved = false;
    });
  }

  function getCanvasPos(e: MouseEvent) {
    const rect = canvas!.getBoundingClientRect();
    const scaleX = canvas!.width / rect.width;
    const scaleY = canvas!.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  canvas.addEventListener("mousedown", (e) => {
    isMouseDown = true;
    const pos = getCanvasPos(e);
    startX = pos.x;
    startY = pos.y;
  });

  canvas.addEventListener("mousemove", (e) => {
    if (!isMouseDown) return;

    pos = getCanvasPos(e);
    x = Math.min(startX, pos.x);
    y = Math.min(startY, pos.y);
    width = Math.abs(pos.x - startX);
    height = Math.abs(pos.y - startY);

    if (ctx) {
      const context = ctx;
      context.clearRect(0, 0, canvas.width, canvas.height);
      Boxes.forEach((box) => {
        drawTextInBox("Looks like", ctx, box, window.subtitleStyleOptions.fontSize);
        context.strokeRect(box.x, box.y, box.width, box.height);
      });
      context.strokeStyle = "blue";
      const box: Box = { x: x, y: y, width: width, height: height, centerX: (x + width) / 2, centerY: (x + height) / 2, orientation: width > height ? 0 : 90 };
      drawTextInBox("Looks like", ctx, box, window.subtitleStyleOptions.fontSize);
      context.strokeRect(x, y, width, height);
    }
  });

  canvas.addEventListener("mouseup", () => {
    isMouseDown = false;
    if (x && y && width && height) {
      const box: Box = { x: x, y: y, width: width, height: height, centerX: (x + width) / 2, centerY: (x + height) / 2, orientation: width > height ? 0 : 90 };
      Boxes.push(box);
    } else {
      return;
    }
  });
}
