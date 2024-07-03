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
    const lspCoq = JSON.parse(localStorage.getItem("coq") || "{}") || "";
    const lspLean = JSON.parse(localStorage.getItem("lean") || "{}") || "";

    // Get the LSP paths from the LSP objects
    let lspCoqPath = lspCoq.path || "";
    let lspLeanPath = lspLean.path || "";

    // Get the current LSP type from local storage
    const currentLspType = localStorage.getItem("currentLspType") || "coq";

    // Create the container and header
    const lspContainer = this.createContainer("LSP Server Path");

    // Create the dropdown for the LSP type
    const lspSelect = this.createDropdown(["Coq", "Lean"]);
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

    // Add event listener to the dropdown
    lspSelect.addEventListener("change", (e) => {
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
    });

    // Create the apply button for the LSP path
    const lspButton = document.createElement("button");
    lspButton.textContent = "Apply";
    lspButton.classList.add("settings-apply-button");

    // Add event listener to the apply button
    lspButton.addEventListener("click", () => {
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
      // Set the font family for the editor
      const fontFamily = `${textFontSelect.value}, ${textStyleSelect.value}`;
      document.documentElement.style.setProperty(`--font-family`, fontFamily);

      // Store the selected font in local storage
      localStorage.setItem("textFont", textFontSelect.value);

      // If the font is Comic Sans, Palatino, or Trebuchet, show the text style dropdown
      // otherwise, hide it.
      // As other fonts do not have styles, the text style dropdown is hidden.
      if (textFontsWithStyles.includes(textFontSelect.value)) {
        textStyleSelect.style.display = "";
      } else {
        textStyleSelect.style.display = "none";
      }
    });

    textStyleSelect.addEventListener("change", () => {
      // Set the font family for the editor
      const fontFamily = `${textFontSelect.value}, ${textStyleSelect.value}`;
      document.documentElement.style.setProperty(`--font-family`, fontFamily);

      // Store the selected style in local storage
      localStorage.setItem("textStyle", textStyleSelect.value);
    });

    textSize.addEventListener("change", () => {
      // Set the font size for the editor
      editor.style.fontSize = textSize.value;

      // Store the selected size in local storage
      localStorage.setItem("textSize", textSize.value);
    });

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
}
