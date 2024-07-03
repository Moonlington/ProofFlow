import { markdownRenderedClickFix } from "../plugins/markdown-extra";

/**
 * Adds a button to the button bar.
 * @param {string} label - The label/text of the button.
 * @param {() => void} callback - The callback function to execute when the button is clicked.
 * @param {string} hoverText - The hover text of the button.
 * @returns The created button.
 */
export function createAddButton(
  label: string,
  callback: () => void,
  hoverText: string,
): HTMLButtonElement {
  const button = document.createElement("button");
  button.innerHTML = label;
  if (label === "line nr") {
    button.id = "line-nr-button";
  } else {
    button.id = label.toLowerCase() + "-button";
  }
  button.addEventListener("click", callback);
  if (label === "Text ↑" || label === "Text ↓") {
    // Ensure we can click on rendered markdown nodes without rendering them again
    button.addEventListener("click", markdownRenderedClickFix);
  }
  button.title = hoverText;
  button.classList.add("editor-button");
  return button;
}

/**
 * Creates a button element.
 * @param {string} symbol - The symbol to display on the button.
 * @param {() => void} cmd - The callback function to execute when the button is clicked.
 * @param {string} hoverText - The hover text of the button.
 * @returns The created button element.
 */
export function CreateButton(
  symbol: string,
  cmd: () => void,
  hoverText: string,
) {
  let button;
  if (symbol === "&#x1f5c1;") {
    button = document.createElement("div");
    const input = document.createElement("input");
    input.type = "file";
    input.id = "file-input";
    input.style.display = "none";

    const label = document.createElement("label");
    label.innerHTML = symbol;
    label.htmlFor = "file-input";
    label.style.paddingTop = "0.5px";
    button.appendChild(input);
    button.appendChild(label);
    label.classList.add("settings-button");
    button.style.border = "none";
  } else {
    button = document.createElement("button");
    button.innerHTML = symbol;
    button.onclick = () => cmd();
    if (symbol === "&#8617;" || symbol === "&#8618;" || symbol === "&#x21bb;") {
      button.style.paddingTop = "2.5px";
    }
    button.classList.add("settings-button");
  }
  button.title = hoverText;

  return button;
}
