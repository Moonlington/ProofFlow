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
  // Set the id of the button
  if (label === "line nr") {
    button.id = "line-nr-button";
  } else { // Set the id of the button
    button.id = label.toLowerCase() + "-button";
  }

  // Add the callback function to the button
  button.addEventListener("click", callback);
  if (label === "Text ↑" || label === "Text ↓") {
    // Ensure we can click on rendered markdown nodes without rendering them again
    button.addEventListener("click", markdownRenderedClickFix);
  }

  // Set the hover text of the button
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
  // Create the button
  let button;
  // if the symbol is the file input symbol, create a file input button
  if (symbol === "&#x1f5c1;") {
    // Create the file input button
    button = document.createElement("div");
    button.style.border = "none";

    // Create the input element
    const input = document.createElement("input");
    input.type = "file";
    input.id = "file-input";
    input.style.display = "none";

    // Create the label for the file input button
    const label = document.createElement("label");
    label.innerHTML = symbol;
    label.htmlFor = "file-input";
    label.style.paddingTop = "0.5px";

    // Append the input and label to the button
    button.appendChild(input);
    button.appendChild(label);

    // Add the event listener to the input
    label.classList.add("settings-button");
  } else {
    // Create a normal button
    button = document.createElement("button");
    button.innerHTML = symbol;

    // Add the callback function to the button
    button.onclick = () => cmd();

    // Customize the button style for certain symbols
    if (symbol === "&#8617;" || symbol === "&#8618;" || symbol === "&#x21bb;") {
      button.style.paddingTop = "2.5px";
    }

    // Add the settings button class to the button
    button.classList.add("settings-button");
  }

  // Set the hover text of the button
  button.title = hoverText;

  return button;
}
