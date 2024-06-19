import { proofFlow } from "../../main";
import { updateColors } from "./updateColors";
import { colorSchemesKeys } from "./updateColors";

/**
 * Represents the settings overlay class.
 */
export class SettingsOverlay {
  private _container: HTMLElement;
  private _overlay: HTMLElement;

  /**
   * Represents the settings class.
   * @param container - The HTML element that will contain the settings.
   */
  constructor(container: HTMLElement) {
    this._container = container;
    this._overlay = this.render();
    this.showOverlay(false);
  }
  


  /**
   * Renders the settings menu overlay.
   *
   * @returns The rendered overlay element.
   */
  private render() {
    // Create the overlay
    const overlay = document.createElement("div");
    overlay.className = "overlay";
    overlay.id = "settings";

    // Get all the settings
    const popup = this.settingsMenu();
    const userModeContainer = this.userModeContainer();
    const colorSchemeContainer = this.colorSchemeContainer();
    const miniMapContainer = this.miniMapContainer();
    const lspContainer = this.lspContainer();
    const textStyleContainer = this.textStyleContainer();

    // Append the elements to the popup
    popup.appendChild(userModeContainer);
    popup.appendChild(miniMapContainer);
    popup.appendChild(colorSchemeContainer);
    popup.appendChild(textStyleContainer);
    popup.appendChild(lspContainer);

    // Append the popup to the overlay
    overlay.appendChild(popup);
    this._container.appendChild(overlay);

    return overlay;
  }

  /**
   * Sets the visibility of the overlay element.
   *
   * @param visible - A boolean value indicating whether the overlay should be visible or not.
   */
  public showOverlay(visible: boolean) {
    this._overlay.style.display = visible ? "flex" : "none";
  }

  private settingsMenu(): HTMLElement {
    // Create the popup
    const popup = document.createElement("div");
    popup.className = "popup";

    // Add close button
    const closeButton = this.closeButton();
    popup.appendChild(closeButton);

    // Add text header
    const header = document.createElement("h2");
    header.textContent = "Settings Menu";
    popup.appendChild(header);

    return popup;
  }

  /**
   * Creates and returns a close button element.
   * The close button is used to close the settings overlay.
   *
   * @returns The close button element.
   */
  private closeButton(): HTMLButtonElement {
    const closeButton = document.createElement("button");
    closeButton.className = "close-button";
    closeButton.id = "close-settings";
    closeButton.innerHTML = "&#x2715;";

    closeButton.addEventListener("click", () => this.showOverlay(false));

    return closeButton;
  }

  /**
   * Creates and returns an HTML element representing the user mode container.
   * This container includes a label, checkbox, and description for the teacher mode.
   * The checkbox has an event listener attached to it.
   *
   * @returns {HTMLElement} The user mode container element.
   */
  private userModeContainer(): HTMLElement {
    // Create the container and header
    const userModeContainer = document.createElement("div");
    userModeContainer.className = "settings-container";

    const userModeLabel = document.createElement("h4");
    userModeLabel.textContent = "Teacher Mode";

    // Create the checkbox for the usermode
    const userModeCheckbox = document.createElement("input");
    userModeCheckbox.type = "checkbox";
    userModeCheckbox.id = "user-mode-checkbox";
    userModeCheckbox.classList.add("checkbox");

    userModeCheckbox.addEventListener("click", () => {
      proofFlow.switchUserMode();
    });

    // Get the current user mode from local storage
    const modeSet: boolean = Boolean(
      localStorage.getItem("teacherMode") === "true",
    );

    if (modeSet) {
      userModeCheckbox.checked = true;
      proofFlow.switchUserMode();
    }

    // Add a label to the checkbox
    const userModeDescription = document.createElement("label");
    userModeDescription.htmlFor = "user-mode-checkbox";
    userModeDescription.textContent =
      "Enable teacher mode; if true, allows the user to edit outside of input areas";
    userModeDescription.classList.add("checkbox");

    userModeContainer.appendChild(userModeLabel);
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
  private colorSchemeContainer(): HTMLElement {
    // Create the container and header
    const colorSchemeContainer = document.createElement("div");
    colorSchemeContainer.className = "settings-container";

    const colorSchemeLabel = document.createElement("h4");
    colorSchemeLabel.textContent = "Color Scheme";

    // Create the checkbox for darkmode
    const darkModeCheckbox = document.createElement("input");
    darkModeCheckbox.type = "checkbox";
    darkModeCheckbox.id = "dark-checkbox";
    darkModeCheckbox.classList.add("checkbox");

    // Add a label to the checkbox
    const darkDescription = document.createElement("label");
    darkDescription.htmlFor = "dark-checkbox";
    darkDescription.textContent = "Dark mode";
    darkDescription.classList.add("checkbox");

    // update the colors when the checkbox is clicked
    darkModeCheckbox.addEventListener("click", () => {
      updateColors(colorSchemeSelect.value, darkModeCheckbox.checked);
      window.localStorage.setItem(
        "darkMode",
        darkModeCheckbox.checked.toString(),
      );
    });

    // Create the dropdown for the color scheme
    const colorSchemeSelect = document.createElement("select");
    colorSchemeSelect.id = "color-theme";
    colorSchemeSelect.className = "dropdown";

    // Add the color schemes to the dropdown
    colorSchemesKeys.forEach((option) => {
      const optionElement = document.createElement("option");
      optionElement.value = option;
      optionElement.textContent = option;
      colorSchemeSelect.appendChild(optionElement);
    });

    // update the colors when the select element is changed
    colorSchemeSelect.addEventListener("change", (e) => {
      const target = e.target as HTMLSelectElement;
      updateColors(target.value, darkModeCheckbox.checked);
      window.localStorage.setItem("colorScheme", target.value);
    });

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

    colorSchemeContainer.appendChild(colorSchemeLabel);
    colorSchemeContainer.appendChild(darkModeCheckbox);
    colorSchemeContainer.appendChild(darkDescription);
    colorSchemeContainer.appendChild(br);
    colorSchemeContainer.appendChild(colorSchemeSelect);

    return colorSchemeContainer;
  }

  private lspContainer(): HTMLElement {
    // Get the LSP objects and types from local storage
    const lspCoq = JSON.parse(localStorage.getItem("Coq") || "{}");
    const lspLean = JSON.parse(localStorage.getItem("Lean") || "{}");

    let lspCoqPath = lspCoq.path || "";
    let lspLeanPath = lspLean.path || "";


    const currentLspType = localStorage.getItem("currentLspType") || "Coq";

    const lspContainer = document.createElement("div");
    const lspLabel = document.createElement("h4");
    lspLabel.textContent = "LSP Server Path";

    const lspSelect = document.createElement("select");
    lspSelect.id = "lsp-type";
    lspSelect.className = "dropdown";
    
    const optionElementCoq = document.createElement("option");
    optionElementCoq.value = "Coq";
    optionElementCoq.textContent = "Coq";
    lspSelect.appendChild(optionElementCoq);
    const optionElementLean = document.createElement("option");
    optionElementLean.value = "Lean";
    optionElementLean.textContent = "Lean";
    lspSelect.appendChild(optionElementLean);
    lspSelect.value = currentLspType || "Coq";

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

    lspSelect.addEventListener("change", (e) => {
      const target = e.target as HTMLSelectElement;
      const lspType = target.value;
      window.localStorage.setItem("currentLspType", lspType);
      if (lspType === "Coq") {
        lspPath.value = JSON.parse(localStorage.getItem("Coq") || "{}").path;
      } else if (lspType === "Lean") {
        lspPath.value = JSON.parse(localStorage.getItem("Lean") || "{}").path;
      }
      proofFlow.setLsp(lspPath.value);
    });


    const lspButton = document.createElement("button");
    lspButton.textContent = "Apply";
    lspButton.addEventListener("click", () => {
      console.log("LSP Path: " + lspPath.value); //TODO Add lspPath functionality
      // proofFlow.setLspPath(lspPath.value);
      let lsp = {
        path: lspPath.value,
        type: lspSelect.value,      
      };
      const lspType = lspSelect.value;
      
      window.localStorage.setItem(lspType, JSON.stringify(lsp));
      window.localStorage.setItem("currentLspType", lspType);
      proofFlow.setLsp(lspPath.value);
    });
    lspButton.classList.add("settings-apply-button");

    lspContainer.appendChild(lspLabel);
    lspContainer.appendChild(lspSelect);
    lspContainer.appendChild(lspPath);
    lspContainer.appendChild(lspButton);

    lspContainer.classList.add("settings-container");
    return lspContainer;
  }

  /**
   * Creates and returns an HTML element representing the mini map container.
   *
   * @returns {HTMLElement} - The mini map container element.
   */
  private miniMapContainer(): HTMLElement {
    // Create the container and header
    const miniMapContainer = document.createElement("div");
    miniMapContainer.classList.add("settings-container");

    const miniMapLabel = document.createElement("h4");
    miniMapLabel.textContent = "Minimap";

    // Create the checkbox for the minimap
    const miniMapCheckbox = document.createElement("input");
    miniMapCheckbox.type = "checkbox";
    miniMapCheckbox.id = "mini-map-checkbox";
    miniMapCheckbox.classList.add("checkbox");

    // Create the label for the checkbox
    const miniMapDescription = document.createElement("label");
    miniMapDescription.htmlFor = "mini-map-checkbox";
    miniMapDescription.textContent = "Enable minimap";
    miniMapDescription.classList.add("checkbox");

    // Add event listener
    miniMapCheckbox.addEventListener("click", () => {
      proofFlow.switchMinimap();
      window.localStorage.setItem(
        "minimap",
        miniMapCheckbox.checked.toString(),
      );
    });

    // Update from storage
    const on = localStorage.getItem("minimap") === "true";

    miniMapCheckbox.checked = on;

    if (!on) {
      proofFlow.switchMinimap();
    }

    miniMapContainer.appendChild(miniMapLabel);
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
  private textStyleContainer() {
    // Create the container and header
    const textStyleContainer = document.createElement("div");
    textStyleContainer.classList.add("settings-container");

    const textStyleLabel = document.createElement("h4");
    textStyleLabel.textContent = "Text Style";

    // Dropdown for the text style
    const textStyleSelect = document.createElement("select");
    textStyleSelect.id = "text-style";
    textStyleSelect.classList.add("dropdown");

    // Add the options
    const textStyleOptions = ["Serif", "Sans-serif", "Monospace"];

    textStyleOptions.forEach((option) => {
      const optionElement = document.createElement("option");
      optionElement.value = option;
      optionElement.textContent = option;
      textStyleSelect.appendChild(optionElement);
    });

    // Add event listener
    textStyleSelect.addEventListener("change", (e) => {
      const target = e.target as HTMLSelectElement;
      const editor = document.getElementById("editor")!;
      editor.style.fontFamily = target.value;
      localStorage.setItem("textStyle", target.value);
    });

    // Dropdown for the text size
    const textSize = document.createElement("select");
    textSize.id = "text-size";
    textSize.classList.add("dropdown");

    // Add the options
    const textSizeOptions = ["Smaller", "Small", "Medium", "Large", "Larger"];

    textSizeOptions.forEach((option) => {
      const optionElement = document.createElement("option");
      optionElement.value = option;
      optionElement.textContent = option;
      textSize.appendChild(optionElement);
    });

    // Add event listener
    textSize.addEventListener("change", (e) => {
      const target = e.target as HTMLSelectElement;
      const editor = document.getElementById("editor")!;
      editor.style.fontSize = target.value;
      localStorage.setItem("textSize", target.value);
    });

    // Update with stored values
    const currentStyle = localStorage.getItem("textStyle");
    const currentSize = localStorage.getItem("textSize");

    if (currentStyle) {
      textStyleSelect.value = currentStyle;
      const editor = document.getElementById("editor")!;
      editor.style.fontFamily = currentStyle;
    }

    if (currentSize) {
      textSize.value = currentSize;
      const editor = document.getElementById("editor")!;
      editor.style.fontSize = currentSize;
    }

    // Append all to the container
    textStyleContainer.appendChild(textStyleLabel);
    textStyleContainer.appendChild(textSize);
    textStyleContainer.appendChild(textStyleSelect);

    return textStyleContainer;
  }
}
