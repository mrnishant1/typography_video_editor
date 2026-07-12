import { globalCanvasTextProperties } from "./sideProps.js";

const panel = document.getElementById("style-panel");
const properties = globalCanvasTextProperties;
const labels = {
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

const options = window.subtitleStyleOptions || {
  fontFamily: "'Akronim'",
  fontSize: "200",
  fontWeight: "400",
  fontStyle: "normal",
  font: "200px 'Akronim'",
  fillStyle: "#4800ff",
  strokeStyle: "#000000",
  lineWidth: "2",
  shadowColor: "rgba(0, 0, 0, 0.96)",
  shadowBlur: "10",
  shadowOffsetX: "10",
  shadowOffsetY: "10",
  backgroundColor: "transparent",
  textAlign: "left",
};
options.font = `${options.fontSize}px ${options.fontFamily}`;
window.subtitleStyleOptions = options;

function getCurrentValue(name) {
  if (name === "font") return options.fontFamily;
  if (name === "color") return options.fillStyle;
  if (name === "strokeColor") return options.strokeStyle;
  if (name === "strokeWidth") return options.lineWidth;
  return options[name];
}

function addSelect(name, values, title = labels[name] || name) {
  const label = document.createElement("label");
  label.textContent = title;
  const select = document.createElement("select");
  select.name = name;
  values.forEach((item) => {
    const value = typeof item === "string" ? item : item.value;
    const text = typeof item === "string" ? item : item.text;
    select.add(new Option(text, value, false, value === getCurrentValue(name)));
  });
  label.append(select);
  panel.append(label);
}


//Pannel UI
if (panel) {
  const fontChoices = [
    { text: "Random fonts", value: "__random__" },
    ...properties.English_fonts,
    ...properties.Hindi_fonts.map((font) => font.replace(/^\d+px\s+/, "")),
  ];
  addSelect("font", fontChoices, "Font");
  Object.entries(properties)
    .filter(([name]) => name !== "English_fonts" && name !== "Hindi_fonts")
    .forEach(([name, values]) => addSelect(name, values));

  panel.addEventListener("change", (event) => {
    const { name, value } = event.target;
    if (!name) return;

    if (name === "font") {
      options.fontFamily = value;
      options.font = `${options.fontSize}px ${value}`;
    } else if (name === "color") {
      options.fillStyle = value;
    } else if (name === "strokeColor") {
      options.strokeStyle = value;
    } else if (name === "strokeWidth") {
      options.lineWidth = value;
    } else if (name === "fontSize") {
      options.fontSize = value;
      options.font = `${value}px ${options.fontFamily}`;
    } else {
      options[name] = value;
    }

    window.restartTimelineRenderer?.();
  });

  const style = document.createElement("style");
  style.textContent = `
    #canvas-row { display:flex; align-items:center; max-width:100%; }
    #style-panel { width:190px; max-height:500px; overflow:auto; padding:10px; box-sizing:border-box; font:12px system-ui; background:#252525; color:#fff; }
    #style-panel label { display:block; margin:0 0 7px; }
    #style-panel select { display:block; width:100%; margin-top:2px; }
    @media (max-width:900px) { #canvas-row { align-items:flex-start; } #style-panel { width:150px; } }
  `;
  document.head.append(style);
}
