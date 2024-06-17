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

    // Create the popup
    const popup = document.createElement("div");
    popup.className = "popup";

    // Add close button
    const closeButton = this.closeButton();
    popup.appendChild(closeButton);

    // Add content
    const header = document.createElement("h2");
    header.textContent = "Settings Menu";

    // Get the settings from the local storage
    const localStorage = window.localStorage;
    const teacherMode: boolean = Boolean(
      localStorage.getItem("teacherMode") === "true",
    );
    const darkMode: boolean = Boolean(
      localStorage.getItem("darkMode") === "true",
    );
    const colorScheme = localStorage.getItem("colorScheme") || "";
    const lspPath = localStorage.getItem("lspPath") || "";

    // Add user mode settings
    const userModeContainer = this.userModeContainer(teacherMode);

    // Add color scheme settings
    const colorSchemeContainer = this.colorSchemeContainer(
      darkMode,
      colorScheme,
    );

    // Add LSP server path settings
    const lspContainer = this.lspContainer(lspPath);

    // Append the elements to the popup
    popup.appendChild(header);
    popup.appendChild(userModeContainer);
    popup.appendChild(colorSchemeContainer);
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
  private userModeContainer(modeSet: boolean): HTMLElement {
    const userModeContainer = document.createElement("div");
    userModeContainer.className = "settings-container";

    const userModeLabel = document.createElement("h4");
    userModeLabel.textContent = "Teacher Mode";

    const userModeCheckbox = document.createElement("input");
    userModeCheckbox.type = "checkbox";
    userModeCheckbox.id = "user-mode-checkbox";
    userModeCheckbox.classList.add("checkbox");

    if (modeSet) {
      userModeCheckbox.checked = true;
      proofFlow.switchUserMode();
    }

    // add the event listener
    userModeCheckbox.addEventListener("click", () => {
      proofFlow.switchUserMode();
    });

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
  private colorSchemeContainer(
    darkMode: boolean,
    colorScheme: string,
  ): HTMLElement {
    const colorSchemeContainer = document.createElement("div");
    colorSchemeContainer.className = "settings-container";

    const colorSchemeLabel = document.createElement("h4");
    colorSchemeLabel.textContent = "Color Scheme";

    const darkModeCheckbox = document.createElement("input");
    darkModeCheckbox.type = "checkbox";
    darkModeCheckbox.id = "dark-checkbox";
    darkModeCheckbox.classList.add("checkbox");

    if (darkMode) {
      darkModeCheckbox.checked = true;
    }

    const darkDescription = document.createElement("label");
    darkDescription.htmlFor = "dark-checkbox";
    darkDescription.textContent = "Dark mode";
    darkDescription.classList.add("checkbox");

    const colorSchemeSelect = document.createElement("select");
    colorSchemeSelect.id = "color-theme";
    colorSchemeSelect.className = "dropdown";

    colorSchemesKeys.forEach((option) => {
      const optionElement = document.createElement("option");
      optionElement.value = option;
      optionElement.textContent = option;
      colorSchemeSelect.appendChild(optionElement);
    });

    if (colorScheme) {
      colorSchemeSelect.value = colorScheme;
    }

    // update the colors when the checkbox is clicked
    darkModeCheckbox.addEventListener("click", () => {
      updateColors(colorSchemeSelect.value, darkModeCheckbox.checked);
      window.localStorage.setItem(
        "darkMode",
        darkModeCheckbox.checked.toString(),
      );
    });

    // update the colors when the select element is changed
    colorSchemeSelect.addEventListener("change", (e) => {
      const target = e.target as HTMLSelectElement;
      updateColors(target.value, darkModeCheckbox.checked);
      window.localStorage.setItem("colorScheme", target.value);
    });

    const br = document.createElement("br");

    colorSchemeContainer.appendChild(colorSchemeLabel);
    colorSchemeContainer.appendChild(darkModeCheckbox);
    colorSchemeContainer.appendChild(darkDescription);
    colorSchemeContainer.appendChild(br);
    colorSchemeContainer.appendChild(colorSchemeSelect);

    return colorSchemeContainer;
  }

  private lspContainer(currentPath: string): HTMLElement {
    const lspContainer = document.createElement("div");
    const lspLabel = document.createElement("h4");
    lspLabel.textContent = "LSP Server Path";

    const lspPath = document.createElement("input");
    lspPath.type = "text";
    lspPath.id = "lsp-path";
    lspPath.placeholder = "Enter the path to the LSP server";
    lspPath.classList.add("settings-text-input");
    lspPath.value = currentPath;

    const lspButton = document.createElement("button");
    lspButton.textContent = "Apply";
    lspButton.addEventListener("click", () => {
      console.log("LSP Path: " + lspPath.value); //TODO Add lspPath functionality
      // proofFlow.setLspPath(lspPath.value);
      window.localStorage.setItem("lspPath", lspPath.value);
    });
    lspButton.classList.add("settings-apply-button");

    lspContainer.appendChild(lspLabel);
    lspContainer.appendChild(lspPath);
    lspContainer.appendChild(lspButton);

    lspContainer.classList.add("settings-container");
    return lspContainer;
  }
}
