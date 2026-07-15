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

type SelectValues = Array<string | number | { text?: string; value?: string | number }> | Record<string, string | number>;

function addSelect(name: string, values: SelectValues, title: string = labels[name] || name): void {
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
    help.dataset.tooltip = "Text size is randomized between the selected minimum and maximum text Size.";
    labelText.append(" ", help);
  }

  const select = document.createElement("select");
  select.name = name;
  // normalize values: accept array, or object map
  if (!values) return;
  let normalized: Array<string | number | { text?: string; value?: string | number }>;
  if (!Array.isArray(values) && typeof values === "object") {
    normalized = Object.entries(values).map(([k, v]) => {
      // prefer v as label if it's a string, otherwise use key
      return { text: typeof v === "string" ? v : String(v), value: k };
    });
  } else {
    normalized = values as Array<string | number | { text?: string; value?: string | number }>;
  }

  normalized.forEach((item) => {
    const value = typeof item === "object" ? item.value ?? String(item) : item;
    const text = typeof item === "object" ? item.text ?? String(item) : item;
    select.add(new Option(String(text), String(value), false, String(value) === String(getCurrentValue(name))));
  });
  if (name === "Word_per_render") select.value = "4";
  if (name === "min_textSize") select.value = "200";
  if (name === "fontSize") select.value = "300";

  //Assigning background color
  select.childNodes.forEach((childNode) => {
    (childNode as HTMLOptionElement).style.backgroundColor = `${(childNode as HTMLOptionElement).value}`;
  });
  label.append(select);
  panel!.append(label);
}

//Pannel UI
if (panel) {
  const fontChoices = [{ text: "Random fonts", value: "__random__" }, ...properties.English_fonts, ...properties.Hindi_fonts.map((font) => font.replace(/^\d+px\s+/, ""))];
  addSelect("Word_per_render", [1, 2, 3, 4, 5, 6, 7, 8], "Word per render");
  addSelect("min_textSize", [100, 150, 200, 250, 300, 400, 450], "Min text size (minimum)");
  addSelect("font", fontChoices, "Font");
  (Object.entries(properties) as [string, string[] | number[]][])
    .filter(([name]) => name !== "English_fonts" && name !== "Hindi_fonts")
    .forEach(([name, values]) => addSelect(name, values, name === "fontSize" ? "Max text Size (Maximum" : name));

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

    window.restartTimelineRenderer?.();
  });
}
