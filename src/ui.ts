import { globalCanvasTextProperties } from "./wordrenderer";
import type { SubtitleStyleOptions } from "./types";

const panel = document.getElementById("style-panel");
const properties = globalCanvasTextProperties;

const labels: Record<string, string> = {
  fontWeight: "Weight",
  fontStyle: "Style",
  fontSize: "Size",
  color: "Text color",
  strokeColor: "Stroke color",
  strokeWidth: "Stroke width",
  shadowColor: "Shadow color",
  shadowBlur: "Shadow blur",
  shadowOffsetX: "Shadow X",
  shadowOffsetY: "Shadow Y",
  backgroundColor: "Background",
  textAlign: "Align",
  rotation: "Rotation",
  scale: "Scale",
  opacity: "Opacity",
};

const options: SubtitleStyleOptions =
  window.subtitleStyleOptions ||
  ({
    fontFamily: "'Creepster'",
    fontSize: "200",
    fontWeight: "400",
    fontStyle: "normal",
    font: "200px 'Creepster'",
    fillStyle: "#4800ff",
    strokeStyle: "#000000",
    lineWidth: 2,
    shadowColor: "rgba(0, 0, 0, 0.96)",
    shadowBlur: 10,
    shadowOffsetX: 10,
    shadowOffsetY: 10,
    backgroundColor: "transparent",
    textAlign: "left",
    rotation: "0",
    scale: "1",
    opacity: "1",
  } as SubtitleStyleOptions);

options.font = `${options.fontSize}px ${options.fontFamily}`;
window.subtitleStyleOptions = options;

function getCurrentValue(name: string): unknown {
  if (name === "font") return options.fontFamily;
  if (name === "color") return options.fillStyle;
  if (name === "strokeColor") return options.strokeStyle;
  if (name === "strokeWidth") return options.lineWidth;

  return (options as unknown as Record<string, unknown>)[name];
}

type SelectValues =
  | Array<string | number | { text?: string; value?: string | number }>
  | Record<string, string | number>;

// Structure to define style groups for UI grouping
const groups = {
  typography: {
    title: "📝 Typography & Layout",
    keys: ["Word_per_render", "font", "min_textSize", "fontSize", "fontStyle", "textAlign"],
    container: null as HTMLElement | null
  },
  colors: {
    title: "🎨 Color & Outline",
    keys: ["color", "backgroundColor", "strokeColor", "strokeWidth"],
    container: null as HTMLElement | null
  },
  shadows: {
    title: "👥 Shadow Effects",
    keys: ["shadowColor", "shadowBlur", "shadowOffsetX", "shadowOffsetY"],
    container: null as HTMLElement | null
  },
  transforms: {
    title: "✨ Transforms & FX",
    keys: ["rotation", "scale", "opacity"],
    container: null as HTMLElement | null
  }
};

// Create the group containers in style-panel
if (panel) {
  Object.entries(groups).forEach(([id, group]) => {
    const groupDiv = document.createElement("div");
    groupDiv.className = `style-group group-${id}`;
    
    const heading = document.createElement("h4");
    heading.className = "style-group-title";
    heading.textContent = group.title;
    groupDiv.appendChild(heading);
    
    const contentDiv = document.createElement("div");
    contentDiv.className = "style-group-content";
    groupDiv.appendChild(contentDiv);
    
    panel.appendChild(groupDiv);
    group.container = contentDiv;
  });
}

function addSelect(
  name: string,
  values: SelectValues,
  title: string = labels[name] || name
): void {
  if (!panel || !values) return;

  const label = document.createElement("label");
  const labelText = document.createElement("span");

  labelText.className = "control-label";
  labelText.textContent = title;
  label.append(labelText);

  if (name === "min_textSize") {
    const help = document.createElement("button");

    help.type = "button";
    help.className = "control-help";
    help.textContent = "i";
    help.setAttribute("aria-label", "About minimum text size");
    help.dataset.tooltip =
      "Text size is randomized between the selected minimum and maximum text size.";

    labelText.append(" ", help);
  }

  const select = document.createElement("select");
  select.name = name;

  let normalized: Array<
    string | number | { text?: string; value?: string | number }
  >;

  if (!Array.isArray(values) && typeof values === "object") {
    normalized = Object.entries(values).map(([key, value]) => ({
      text: typeof value === "string" ? value : String(value),
      value: key,
    }));
  } else {
    normalized = values;
  }

  normalized.forEach((item) => {
    const value =
      typeof item === "object" ? (item.value ?? String(item)) : item;

    const text =
      typeof item === "object" ? (item.text ?? String(item)) : item;

    const option = new Option(
      String(text),
      String(value),
      false,
      String(value) === String(getCurrentValue(name))
    );

    if (name === "font") {
      option.style.fontFamily = String(value);
    }

    select.add(option);
  });

  if (name === "Word_per_render") select.value = "4";
  if (name === "min_textSize") select.value = "100";
  if (name === "fontSize") select.value = "200";

  select.querySelectorAll("option").forEach((option) => {
    option.style.backgroundColor = option.value;
  });

  label.append(select);

  // Find corresponding group container to append to
  let targetContainer = panel;
  for (const group of Object.values(groups)) {
    if (group.keys.includes(name)) {
      targetContainer = group.container || panel;
      break;
    }
  }
  targetContainer.appendChild(label);
}

// ================================ STYLE PANEL ================================

if (panel) {
  const fontChoices = [
    { text: "Random fonts", value: "__random__" },
    ...properties.English_fonts,
    ...properties.Hindi_fonts.map((font) =>
      font.replace(/^\d+px\s+/, "")
    ),
  ];

  addSelect("Word_per_render", [1, 2, 3, 4, 5, 6, 7, 8], "Word per render");
  addSelect("font", fontChoices, "Font");
  addSelect(
    "min_textSize",
    [10, 20, 30, 40, 50, 70, 100, 150, 200, 250, 300, 400, 450],
    "Min text size (minimum)"
  );

  (Object.entries(properties) as [string, string[] | number[]][])
    .filter(([name]) => name !== "English_fonts" && name !== "Hindi_fonts")
    .forEach(([name, values]) =>
      addSelect(
        name,
        values,
        name === "fontSize" ? "Max text size (maximum)" : name
      )
    );

  panel.addEventListener("change", (event) => {
    const target = event.target as HTMLSelectElement;
    const { name, value } = target;

    if (!name) return;

    if (name === "font") {
      options.fontFamily = value;
      options.font = `${options.fontSize}px ${value}`;
    } else if (name === "color") {
      options.fillStyle = value;
    } else if (name === "strokeColor") {
      options.strokeStyle = value;
    } else if (name === "strokeWidth") {
      options.lineWidth = Number(value);
    } else if (name === "fontSize") {
      options.fontSize = value;
      options.font = `${value}px ${options.fontFamily}`;
    } else {
      (options as unknown as Record<string, unknown>)[name] = value;
    }

    if (name === "Word_per_render") {
      window.updateStatsDashboard?.();
    }

    window.restartTimelineRenderer?.();
  });
}

// ================================ CANVAS UI ================================

const canvas = document.getElementById("canvas") as HTMLCanvasElement | null;

export interface CanvasConfig {
  width: number;
  height: number;
  orientation: "16:9" | "9:16";
  resolution: "1080" | "1440" | "2160" | "custom";
}

export const canvasConfig: CanvasConfig = {
  width: 1920,
  height: 1080,
  orientation: "16:9",
  resolution: "1080",
};

let ctx: CanvasRenderingContext2D | null = null;

function calculateCanvasDimensions(
  orientation: "16:9" | "9:16",
  resolution: "1080" | "1440" | "2160"
): { width: number; height: number } {
  const resolutions = {
    "1080": {
      "16:9": { width: 1920, height: 1080 },
      "9:16": { width: 1080, height: 1920 },
    },
    "1440": {
      "16:9": { width: 2560, height: 1440 },
      "9:16": { width: 1440, height: 2560 },
    },
    "2160": {
      "16:9": { width: 3840, height: 2160 },
      "9:16": { width: 2160, height: 3840 },
    },
  };

  return resolutions[resolution][orientation];
}

function applyCanvasSettings(config: CanvasConfig): void {
  if (!canvas) return;

  canvas.width = config.width;
  canvas.height = config.height;

  ctx = canvas.getContext("2d");

  console.log("Canvas settings applied:", config);
  
  // Update stats dashboard
  window.updateStatsDashboard?.();
}

applyCanvasSettings(canvasConfig);

const orientationSelect =
  document.getElementById("canvasOrientation") as HTMLSelectElement;

const resolutionSelect =
  document.getElementById("canvasResolution") as HTMLSelectElement;

const customDimensionsInput =
  document.getElementById("customDimensionsInput") as HTMLElement;

const canvasWidthInput =
  document.getElementById("canvasWidth") as HTMLInputElement;

const canvasHeightInput =
  document.getElementById("canvasHeight") as HTMLInputElement;

const applyButton =
  document.getElementById("applyCanvasSettings") as HTMLButtonElement;

if (resolutionSelect) {
  resolutionSelect.addEventListener("change", (event) => {
    const value = (event.target as HTMLSelectElement).value;

    if (customDimensionsInput) {
      customDimensionsInput.style.display =
        value === "custom" ? "flex" : "none";
    }
  });
}

if (applyButton) {
  applyButton.addEventListener("click", () => {
    const orientation =
      (orientationSelect?.value || "16:9") as "16:9" | "9:16";

    const resolution =
      (resolutionSelect?.value || "1080") as
        | "1080"
        | "1440"
        | "2160"
        | "custom";

    if (resolution === "custom") {
      const width = Number.parseInt(
        canvasWidthInput?.value || "1920",
        10
      );

      const height = Number.parseInt(
        canvasHeightInput?.value || "1080",
        10
      );

      if (width <= 0 || height <= 0) return;

      canvasConfig.width = width;
      canvasConfig.height = height;
      canvasConfig.resolution = "custom";
      canvasConfig.orientation = orientation;
    } else {
      const dimensions = calculateCanvasDimensions(
        orientation,
        resolution
      );

      canvasConfig.width = dimensions.width;
      canvasConfig.height = dimensions.height;
      canvasConfig.resolution = resolution;
      canvasConfig.orientation = orientation;
    }

    applyCanvasSettings(canvasConfig);
  });
}

// ================================ LIVE STATS & FILE STATUS SYNC ================================

// Global stats updater function
window.updateStatsDashboard = () => {
  const durationEl = document.getElementById("stat-duration");
  const segmentsEl = document.getElementById("stat-segments");
  const resolutionEl = document.getElementById("stat-resolution");
  const wordsEl = document.getElementById("stat-words");

  if (durationEl) {
    const duration = window.audioDuration || 0;
    durationEl.textContent = `${(duration / 1000).toFixed(2)}s`;
  }
  if (segmentsEl) {
    const count = window.subtitlesCount || 0;
    segmentsEl.textContent = `${count} clips`;
  }
  if (resolutionEl) {
    const activeCanvas = document.getElementById("canvas") as HTMLCanvasElement;
    if (activeCanvas) {
      resolutionEl.textContent = `${activeCanvas.width}×${activeCanvas.height}`;
    }
  }
  if (wordsEl) {
    const wordPerRenderSelect = document.getElementsByName("Word_per_render")[0] as HTMLSelectElement;
    wordsEl.textContent = `${wordPerRenderSelect?.value || 4} words`;
  }
};

// Add change listeners to upload inputs to show filename status
const srtInput = document.getElementById("transcriptInput") as HTMLInputElement;
const audioInput = document.getElementById("audioInput") as HTMLInputElement;
const bgInput = document.getElementById("backgroundInput") as HTMLInputElement;

srtInput?.addEventListener("change", () => {
  const statusEl = document.getElementById("srt-status");
  if (statusEl && srtInput.files?.[0]) {
    statusEl.textContent = srtInput.files[0].name;
    statusEl.classList.add("file-uploaded");
  }
});

audioInput?.addEventListener("change", () => {
  const statusEl = document.getElementById("audio-status");
  if (statusEl && audioInput.files?.[0]) {
    statusEl.textContent = audioInput.files[0].name;
    statusEl.classList.add("file-uploaded");
  }
});

bgInput?.addEventListener("change", () => {
  const statusEl = document.getElementById("bg-status");
  if (statusEl && bgInput.files?.[0]) {
    statusEl.textContent = bgInput.files[0].name;
    statusEl.classList.add("file-uploaded");
  }
});

// Initial run
setTimeout(() => {
  window.updateStatsDashboard?.();
}, 200);
