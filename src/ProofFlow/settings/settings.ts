import { proofFlow } from "../../main";
import {
  CoqMDOutput,
  LeanOutput,
  PureLeanOutput,
} from "../parser/outputconfigs";
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
    overlay.style.display = "";

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        this.showOverlay(false);
      }
    });

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

  /**
   * Creates and returns the settings menu element.
   *
   * @returns The settings menu element as an HTMLElement.
   */
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
   * Creates a container element with the specified header.
   *
   * @param header - The text content for the container header.
   * @returns The created container element.
   */
  private createContainer(header: string): HTMLElement {
    const container = document.createElement("div");
    container.className = "settings-container";

    const containerHeader = document.createElement("h4");
    containerHeader.textContent = header;

    container.appendChild(containerHeader);

    return container;
  }

  /**
   * Creates a dropdown element with the specified header and options.
   *
   * @param header - The header text for the dropdown.
   * @param options - An array of strings representing the options for the dropdown.
   * @returns The created dropdown element.
   */
  private createDropdown(options: string[]): HTMLSelectElement {
    const dropdown = document.createElement("select");
    dropdown.className = "dropdown";

    options.forEach((option) => {
      const optionElement = document.createElement("option");
      optionElement.value = option;
      optionElement.textContent = option;
      dropdown.appendChild(optionElement);
    });

    return dropdown;
  }

  /**
   * Creates a checkbox element.
   *
   * @returns The created checkbox element.
   */
  private createCheckbox(id: string): HTMLInputElement {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = id;
    checkbox.classList.add("checkbox");

    return checkbox;
  }

  /**
   * Creates an HTML label element with the specified text and "for" attribute.
   * @param text - The text content of the label.
   * @param htmlFor - The value of the "for" attribute, specifying the ID of the associated form element.
   * @returns The created HTML label element.
   */
  private createLabel(text: string, htmlFor: string): HTMLLabelElement {
    const label = document.createElement("label");
    label.textContent = text;
    label.htmlFor = htmlFor;
    label.classList.add("checkbox");

    return label;
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
    const userModeContainer = this.createContainer("Teacher Mode");

    // Create the checkbox for the usermode
    const userModeCheckbox = this.createCheckbox("user-mode-checkbox");

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
    const userModeDescription = this.createLabel(
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
  private colorSchemeContainer(): HTMLElement {
    // Create the container and header
    const colorSchemeContainer = this.createContainer("Color Scheme");

    // Create the checkbox for darkmode
    const darkModeCheckbox = this.createCheckbox("dark-checkbox");

    // Add a label to the checkbox
    const darkDescription = this.createLabel("Dark mode", "dark-checkbox");

    // update the colors when the checkbox is clicked
    darkModeCheckbox.addEventListener("click", () => {
      updateColors(colorSchemeSelect.value, darkModeCheckbox.checked);
      window.localStorage.setItem(
        "darkMode",
        darkModeCheckbox.checked.toString(),
      );
    });

    // Create the dropdown for the color scheme
    const colorSchemeSelect = this.createDropdown(colorSchemesKeys);

    // update the colors when the select element is changed
    colorSchemeSelect.addEventListener("change", () => {
      updateColors(colorSchemeSelect.value, darkModeCheckbox.checked);
      window.localStorage.setItem("colorScheme", colorSchemeSelect.value);
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
  private lspContainer(): HTMLElement {
    // Get the LSP objects and types from local storage
    const lspCoq = JSON.parse(localStorage.getItem("coq") || "{}");
    const lspLean = JSON.parse(localStorage.getItem("lean") || "{}");

    let lspCoqPath = lspCoq.path || "";
    let lspLeanPath = lspLean.path || "";

    const currentLspType = localStorage.getItem("currentLspType") || "coq";

    const lspContainer = document.createElement("div");
    const lspLabel = document.createElement("h4");
    lspLabel.textContent = "LSP Server Path";

    const lspSelect = document.createElement("select");
    lspSelect.id = "lsp-type";
    lspSelect.className = "dropdown";

    const optionElementCoq = document.createElement("option");
    optionElementCoq.value = "coq";
    optionElementCoq.textContent = "Coq";
    lspSelect.appendChild(optionElementCoq);
    const optionElementLean = document.createElement("option");
    optionElementLean.value = "lean";
    optionElementLean.textContent = "Lean";
    lspSelect.appendChild(optionElementLean);
    lspSelect.value = currentLspType || "coq";

    const lspPath = document.createElement("input");
    lspPath.type = "text";
    lspPath.id = "lsp-path";
    lspPath.placeholder = "Enter the path to the LSP server";
    lspPath.classList.add("settings-text-input");
    if (currentLspType == "coq") {
      lspPath.value = lspCoqPath;
    } else if (currentLspType == "lean") {
      lspPath.value = lspLeanPath;
    }

    lspSelect.addEventListener("change", (e) => {
      const target = e.target as HTMLSelectElement;
      const lspType = target.value;
      window.localStorage.setItem("currentLspType", lspType);
      if (lspType === "coq") {
        lspPath.value = JSON.parse(localStorage.getItem("coq") || "{}").path;
      } else if (lspType === "lean") {
        lspPath.value = JSON.parse(localStorage.getItem("lean") || "{}").path;
      }
    });

    const lspButton = document.createElement("button");
    lspButton.textContent = "Apply";
    lspButton.addEventListener("click", () => {
      console.log("LSP Path: " + lspPath.value); //TODO Add lspPath functionality
      // proofFlow.setLspPath(lspPath.value);
      if (!proofFlow.hasFileOpen) {
        switch (lspSelect.value) {
          case "lean":
            proofFlow.setOutputConfig(PureLeanOutput);
            proofFlow.fileName = "file.lean";
            break;
          case "coq":
            proofFlow.setOutputConfig(CoqMDOutput);
            proofFlow.fileName = "file.mv";
            break;
          default:
            break;
        }
      }
      let lsp = {
        path: lspPath.value,
        type: lspSelect.value,
      };
      const lspType = lspSelect.value;

      window.localStorage.setItem(lspType, JSON.stringify(lsp));
      window.localStorage.setItem("currentLspType", lspType);
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
    const miniMapContainer = this.createContainer("Minimap");

    // Create the checkbox for the minimap
    const miniMapCheckbox = this.createCheckbox("mini-map-checkbox");

    // Create the label for the checkbox
    const miniMapDescription = this.createLabel(
      "Enable minimap",
      "mini-map-checkbox",
    );

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
    const editor = document.getElementById("editor")!;

    // Create the container and header
    const textStyleContainer = this.createContainer("Text Style");

    // Dropdown for the text style
    const textStyleOptions = ["Serif", "Sans-serif", "Monospace"];
    const textStyleSelect = this.createDropdown(textStyleOptions);

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
    const textSize = this.createDropdown(textSizeOptions);

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

    const textFontSelect = this.createDropdown(textFontOptions);

    // Add event listeners
    textFontSelect.addEventListener("change", () => {
      const fontFamily = `${textFontSelect.value}, ${textStyleSelect.value}`;
      document.documentElement.style.setProperty(`--font-family`, fontFamily);
      localStorage.setItem("textFont", textFontSelect.value);
      if (textFontsWithStyles.includes(textFontSelect.value)) {
        textStyleSelect.style.display = "";
      } else {
        textStyleSelect.style.display = "none";
      }
    });

    textStyleSelect.addEventListener("change", () => {
      const fontFamily = `${textFontSelect.value}, ${textStyleSelect.value}`;
      document.documentElement.style.setProperty(`--font-family`, fontFamily);
      localStorage.setItem("textStyle", textStyleSelect.value);
    });

    textSize.addEventListener("change", () => {
      editor.style.fontSize = textSize.value;
      localStorage.setItem("textSize", textSize.value);
    });

    // Update with stored values
    const currentStyle = localStorage.getItem("textStyle");
    const currentSize = localStorage.getItem("textSize");
    const currentFont = localStorage.getItem("textFont");

    if (currentFont && textFontsWithStyles.includes(currentFont)) {
      textStyleSelect.style.display = "";
    } else {
      textStyleSelect.style.display = "none";
    }

    let fontFamily = "";

    if (currentFont) {
      textFontSelect.value = currentFont;
      fontFamily += currentFont;
    }

    if (currentStyle) {
      textStyleSelect.value = currentStyle;
      fontFamily += currentFont ? `, ${currentStyle}` : currentStyle;
    }

    if (currentFont || currentStyle) {
      document.documentElement.style.setProperty(`--font-family`, fontFamily);
    }

    if (currentSize) {
      textSize.value = currentSize;
      editor.style.fontSize = currentSize;
    }

    // Append all to the container
    textStyleContainer.appendChild(textSize);
    textStyleContainer.appendChild(textFontSelect);
    textStyleContainer.appendChild(textStyleSelect);

    return textStyleContainer;
  }
}
