import { globalCanvasTextProperties } from "./wordrenderer.js";

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
  fontFamily: "'Creepster'",
  fontSize: "200",
  fontWeight: "400",
  fontStyle: "normal",
  font: "200px 'Creepster'",
  fillStyle: "#4800ff",
  strokeStyle: "#000000",
  lineWidth: "2",
  shadowColor: "rgba(0, 0, 0, 0.96)",
  shadowBlur: "10",
  shadowOffsetX: "10",
  shadowOffsetY: "10",
  backgroundColor: "transparent",
  textAlign: "left",
  rotation: "0",
  scale: "1",
  opacity: "1",
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
      "Text size is randomized between the selected minimum and maximum text Size.";
    labelText.append(" ", help);
  }

  const select = document.createElement("select");
  select.name = name;
  // normalize values: accept array, or object map
  if (!values) return;
  if (!Array.isArray(values) && typeof values === "object") {
    values = Object.entries(values).map(([k, v]) => {
      // prefer v as label if it's a string, otherwise use key
      return { text: typeof v === "string" ? v : String(v), value: k };
    });
  }

  values.forEach((item) => {
    const value = typeof item === "string" ? item : (item.value ?? String(item));
    const text = typeof item === "string" ? item : (item.text ?? String(item));
    select.add(new Option(text, value, false, value === String(getCurrentValue(name))));
  });
  if (name === "Word_per_render") select.value = "4";
  if (name === "min_textSize") select.value = "200";
  if (name === "fontSize") select.value = "300";

  //Assigning background color
  select.childNodes.forEach((childNode)=>{
    childNode.style.backgroundColor = `${childNode.value}`
  })
  label.append(select);
  panel.append(label);
}


//Pannel UI
if (panel) {
  const fontChoices = [
    { text: "Random fonts", value: "__random__"},
    ...properties.English_fonts,
    ...properties.Hindi_fonts.map((font) => font.replace(/^\d+px\s+/, "")),
  ];
  addSelect("Word_per_render", [1,2,3,4,5,6,7,8], "Word per render");
  addSelect("min_textSize", [100,150,200,250,300,400,450], "Min text size (minimum)");
  addSelect("font", fontChoices, "Font");
  Object.entries(properties)
    .filter(([name]) => name !== "English_fonts" && name !== "Hindi_fonts")
    .forEach(([name, values]) => addSelect(name, values, name==="fontSize"?"Max text Size (Maximum":name));

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
    #style-panel { width:500px; max-height:500px; overflow:auto; padding:10px; box-sizing:border-box; font:12px system-ui; background:#252525; color:#fff; }
    #style-panel label { display:block; margin:0 0 7px; }
    #style-panel .control-label { display:flex; align-items:center; gap:4px; }
    #style-panel select { display:block; width:100%; margin-top:2px; }
    #style-panel .control-help {
      position:relative; display:inline-grid; place-items:center; width:15px; height:15px;
      padding:0; border:1px solid #858585; border-radius:50%; background:transparent;
      color:#d7d7d7; font:700 10px/1 system-ui; cursor:help;
    }
    #style-panel .control-help::after {
      content:attr(data-tooltip); position:absolute; z-index:10; top:calc(100% + 7px); left:0;
      width:175px; padding:7px 8px; border-radius:4px; background:#111; color:#fff;
      box-shadow:0 3px 10px rgba(0,0,0,.35); font:11px/1.35 system-ui; text-align:left;
      opacity:0; pointer-events:none; transform:translateY(-2px); transition:opacity .15s, transform .15s;
    }
    #style-panel .control-help:hover::after, #style-panel .control-help:focus-visible::after {
      opacity:1; transform:translateY(0);
    }
    @media (max-width:900px) { #canvas-row { align-items:flex-start; } #style-panel { width:150px; } }
  `;
  document.head.append(style);
}
