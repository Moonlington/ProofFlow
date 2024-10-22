import { proofFlow } from "../../main";
import { CoqMDOutput, PureLeanOutput } from "../parser/outputconfigs";
import {
  createCheckbox,
  createContainer,
  createDropdown,
  createLabel,
} from "./elementCreation";
import { colorSchemesKeys, updateColors } from "./updateColors";

/**
 * Creates and returns an HTML element representing the user mode container.
 * This container includes a label, checkbox, and description for the teacher mode.
 * The checkbox has an event listener attached to it.
 *
 * @returns {HTMLElement} The user mode container element.
 */
export function createUserModeContainer(): HTMLElement {
  // Create the container and header
  const userModeContainer = createContainer("Teacher Mode");

  // Handle the user mode change
  const handleUserModeClick = (e: Event) => {
    proofFlow.switchUserMode();
  };

  // Create the checkbox for the usermode
  const userModeCheckbox = createCheckbox(
    "user-mode-checkbox",
    handleUserModeClick,
  );

  // Get the current user mode from local storage
  const modeSet: boolean = Boolean(
    localStorage.getItem("teacherMode") === "true",
  );

  if (modeSet) {
    userModeCheckbox.checked = true;
    proofFlow.switchUserMode();
  }

  // Add a label to the checkbox
  const userModeDescription = createLabel(
    "Enable teacher mode; if true, allows the user to edit outside of input areas",
    "user-mode-checkbox",
  );

  userModeContainer.appendChild(userModeCheckbox);
  userModeContainer.appendChild(userModeDescription);

  return userModeContainer;
}

/**
 * Creates and returns the color scheme container element.
 * The color scheme container contains a label and a dropdown select element for choosing the color scheme.
 *
 * @returns The color scheme container element.
 */
export function createColorSchemeContainer(): HTMLElement {
  // Create the container and header
  const colorSchemeContainer = createContainer("Color Scheme");

  // Handle the color scheme change
  const handleColorSchemeChange = (e: Event) => {
    updateColors(colorSchemeSelect.value, darkModeCheckbox.checked);
    window.localStorage.setItem(
      "darkMode",
      darkModeCheckbox.checked.toString(),
    );
  };
  // Create the checkbox for darkmode
  const darkModeCheckbox = createCheckbox(
    "dark-checkbox",
    handleColorSchemeChange,
  );

  // Add a label to the checkbox
  const darkDescription = createLabel("Dark mode", "dark-checkbox");

  // Handle the dark mode change
  const handleDarkModeClick = (e: Event) => {
    updateColors(colorSchemeSelect.value, darkModeCheckbox.checked);
    window.localStorage.setItem("colorScheme", colorSchemeSelect.value);
  };

  // Create the dropdown for the color scheme
  const colorSchemeSelect = createDropdown(
    colorSchemesKeys,
    handleDarkModeClick,
  );

  // Get the current color scheme from local storage
  const darkMode: boolean = Boolean(
    localStorage.getItem("darkMode") === "true",
  );

  const colorScheme = localStorage.getItem("colorScheme") || "";

  if (darkMode) {
    darkModeCheckbox.checked = true;
  }

  if (colorScheme) {
    colorSchemeSelect.value = colorScheme;
  }

  const br = document.createElement("br");

  colorSchemeContainer.appendChild(darkModeCheckbox);
  colorSchemeContainer.appendChild(darkDescription);
  colorSchemeContainer.appendChild(br);
  colorSchemeContainer.appendChild(colorSchemeSelect);

  return colorSchemeContainer;
}

/**
 * Creates and returns an HTML element representing the LSP container.
 * The LSP container includes a label, an input field, and an apply button.
 * The input field is pre-filled with the current LSP path retrieved from local storage.
 * When the apply button is clicked, the LSP path is saved to local storage.
 *
 * @returns {HTMLElement} The LSP container element.
 */
export function createLspContainer(): HTMLElement {
  // Get the LSP objects and types from local storage
  const lspCoq = JSON.parse(localStorage.getItem("coq") || "{}") || "";
  const lspLean = JSON.parse(localStorage.getItem("lean") || "{}") || "";

  // Get the LSP paths from the LSP objects
  let lspCoqPath = lspCoq.path || "";
  let lspLeanPath = lspLean.path || "";

  // Get the current LSP type from local storage
  const currentLspType = localStorage.getItem("currentLspType") || "coq";

  // Create the container and header
  const lspContainer = createContainer("LSP Server Path");

  // Handle the LSP type change
  const handleLspTypeChange = (e: Event) => {
    // Get the selected LSP type
    const target = e.target as HTMLSelectElement;
    const lspType = target.value;

    // Update the local storage with the current LSP type
    window.localStorage.setItem("currentLspType", lspType);

    // Update the LSP path input field with the path for the selected LSP type
    if (lspType === "Coq") {
      lspPath.value =
        JSON.parse(localStorage.getItem("coq") || "{}").path || "";
    } else if (lspType === "Lean") {
      lspPath.value =
        JSON.parse(localStorage.getItem("lean") || "{}").path || "";
    }
  };

  // Create the dropdown for the LSP type
  const lspSelect = createDropdown(["Coq", "Lean"], handleLspTypeChange);
  lspSelect.value = currentLspType;

  // Create the input field for the LSP path
  const lspPath = document.createElement("input");
  lspPath.type = "text";
  lspPath.id = "lsp-path";
  lspPath.placeholder = "Enter the path to the LSP server";
  lspPath.classList.add("settings-text-input");
  if (currentLspType == "Coq") {
    lspPath.value = lspCoqPath;
  } else if (currentLspType == "Lean") {
    lspPath.value = lspLeanPath;
  }

  // Create the apply button for the LSP path
  const lspButton = document.createElement("button");
  lspButton.textContent = "Apply";
  lspButton.classList.add("settings-apply-button");

  // Add event listener to the apply button
  lspButton.addEventListener("click", () => {
    console.log("LSP Path: " + lspPath.value);
    // if the file is not open, set the output config and file name based on the LSP type
    if (!proofFlow.hasFileOpen) {
      switch (lspSelect.value) {
        case "Lean":
          // Set the output config and file name for Lean
          proofFlow.setOutputConfig(PureLeanOutput);
          proofFlow.fileName = "file.lean";
          break;
        case "Coq":
          // Set the output config and file name for Coq
          proofFlow.setOutputConfig(CoqMDOutput);
          proofFlow.fileName = "file.mv";
          break;
        default:
          break;
      }
    }
    // Create the LSP object with the path and type
    let lsp = {
      path: lspPath.value,
      type: lspSelect.value,
    };
    const lspType = lspSelect.value;

    // Update the LSP path in local storage
    window.localStorage.setItem(lspType.toLowerCase(), JSON.stringify(lsp));
    window.localStorage.setItem("currentLspType", lspType);
  });

  // Append all to the container
  lspContainer.appendChild(lspSelect);
  lspContainer.appendChild(lspPath);
  lspContainer.appendChild(lspButton);
  lspContainer.classList.add("settings-container");

  // return the container
  return lspContainer;
}

/**
 * Creates and returns an HTML element representing the mini map container.
 *
 * @returns {HTMLElement} - The mini map container element.
 */
export function createMiniMapContainer(): HTMLElement {
  // Create the container and header
  const miniMapContainer = createContainer("Minimap");

  // Handle the minimap change
  const handleMinimapClick = (e: Event) => {
    proofFlow.switchMinimap();
    window.localStorage.setItem(
      "minimap",
      (e.target as HTMLInputElement).checked.toString(),
    );
  };

  // Create the checkbox for the minimap
  const miniMapCheckbox = createCheckbox(
    "mini-map-checkbox",
    handleMinimapClick,
  );

  // Create the label for the checkbox
  const miniMapDescription = createLabel("Enable minimap", "mini-map-checkbox");

  // Update from storage
  const on = localStorage.getItem("minimap") === "true";

  miniMapCheckbox.checked = on;

  if (!on) {
    proofFlow.switchMinimap();
  }

  miniMapContainer.appendChild(miniMapCheckbox);
  miniMapContainer.appendChild(miniMapDescription);

  return miniMapContainer;
}

/**
 * Creates a container element for text style settings.
 * The container includes a header, dropdowns for text style and text size,
 * and event listeners to update the editor's font family and font size.
 * The container also retrieves and sets stored values for text style and text size.
 *
 * @returns The created container element.
 */
export function createTextStyleContainer() {
  const editor = document.getElementById("editor")!;

  // Create the container and header
  const textStyleContainer = createContainer("Text Style");

  // Handle the text style change
  const handleTextStyleChange = (e: Event) => {
    // Update the font family when the select style element is changed
    // and store the value in local storage.

    const fontFamily = `${textFontSelect.value}, ${textStyleSelect.value}`;
    document.documentElement.style.setProperty(`--font-family`, fontFamily);
    localStorage.setItem("textStyle", textStyleSelect.value);
  };

  // Dropdown for the text style
  const textStyleOptions = ["Serif", "Sans-serif", "Monospace"];
  const textStyleSelect = createDropdown(
    textStyleOptions,
    handleTextStyleChange,
  );

  // Handle the text size change
  const handleTextSizeChange = (e: Event) => {
    // Update the font size when the select text size element is changed
    // and store the value in local storage.
    editor.style.fontSize = textSize.value;
    localStorage.setItem("textSize", textSize.value);
  };

  // Dropdown for the text size
  const textSizeOptions = [
    "X-Small",
    "Small",
    "Smaller",
    "Medium",
    "Large",
    "Larger",
    "X-Large",
  ];
  const textSize = createDropdown(textSizeOptions, handleTextSizeChange);

  // Handle the text font change
  const handleTextFontChange = (e: Event) => {
    // Update the font family when the select Font element is changed
    // and store the value in local storage.
    const fontFamily = `${textFontSelect.value}, ${textStyleSelect.value}`;
    document.documentElement.style.setProperty(`--font-family`, fontFamily);
    localStorage.setItem("textFont", textFontSelect.value);
    if (textFontsWithStyles.includes(textFontSelect.value)) {
      textStyleSelect.style.display = "";
    } else {
      textStyleSelect.style.display = "none";
    }
  };

  // Dropdown for the text font
  const textFontOptions = [
    "Arial",
    "Times New Roman",
    "Courier New",
    "Georgia",
    "Verdana",
    "Trebuchet",
    "Palatino",
    "Garamond",
    "Comic Sans",
  ];
  const textFontsWithStyles = ["Comic Sans", "Palatino", "Trebuchet"];

  const textFontSelect = createDropdown(textFontOptions, handleTextFontChange);

  // Update with stored values
  const currentStyle = localStorage.getItem("textStyle") || "Sans-serif";
  const currentSize = localStorage.getItem("textSize") || "Medium";
  const currentFont = localStorage.getItem("textFont") || "Arial";

  // if the font is Comic Sans, Palatino, or Trebuchet, show the text style dropdown
  // otherwise, hide it.
  // As other fonts do not have styles, the text style dropdown is hidden.
  if (currentFont && textFontsWithStyles.includes(currentFont)) {
    textStyleSelect.style.display = "";
  } else {
    textStyleSelect.style.display = "none";
  }

  // Initialize the font family string
  let fontFamily = "";

  // Set the font for the editor
  if (currentFont) {
    textFontSelect.value = currentFont;
    fontFamily += currentFont;
  }

  // Set the text style for the editor
  if (currentStyle) {
    textStyleSelect.value = currentStyle;
    fontFamily += currentFont ? `, ${currentStyle}` : currentStyle;
  }

  // Set the font family for the editor
  if (currentFont || currentStyle) {
    document.documentElement.style.setProperty(`--font-family`, fontFamily);
  }

  // Set the font size for the editor
  if (currentSize) {
    textSize.value = currentSize;
    editor.style.fontSize = currentSize;
  }

  // Append all to the container
  textStyleContainer.appendChild(textSize);
  textStyleContainer.appendChild(textFontSelect);
  textStyleContainer.appendChild(textStyleSelect);

  // return the container
  return textStyleContainer;
}
