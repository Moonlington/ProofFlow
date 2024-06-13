import { proofFlow } from "../../main";
import { updateColors } from "./colorschemes";

export class SettingsOverlay {
  private _container: HTMLElement;
  private _overlay: HTMLElement;

  constructor(container: HTMLElement) {
    this._container = container;
    this._overlay = this.render();
    this.showOverlay(false);
  }

  private render() {
    const overlay = document.createElement("div");
    overlay.className = "overlay";
    overlay.id = "settings";

    const popup = document.createElement("div");
    popup.className = "popup";

    const closeButton = document.createElement("button");
    closeButton.className = "close-button";
    closeButton.id = "close-settings";
    closeButton.innerHTML = "&#x2715;";

    const header = document.createElement("h2");
    header.textContent = "Settings Menu";

    const userModeContainer = document.createElement("div");
    userModeContainer.className = "settings-container";

    const userModeLabel = document.createElement("h4");
    userModeLabel.textContent = "Teacher Mode";

    const userModeCheckbox = document.createElement("input");
    userModeCheckbox.type = "checkbox";
    userModeCheckbox.id = "user-mode-checkbox";
    userModeCheckbox.classList.add("checkbox");

    const userModeDescription = document.createElement("label");
    userModeDescription.htmlFor = "user-mode-checkbox";
    userModeDescription.textContent =
      "Enable teacher mode; if true, allows the user to edit outside of input areas";
    userModeDescription.classList.add("checkbox");

    userModeContainer.appendChild(userModeLabel);
    userModeContainer.appendChild(userModeCheckbox);
    userModeContainer.appendChild(userModeDescription);

    const colorSchemeContainer = document.createElement("div");
    colorSchemeContainer.className = "settings-container";

    const colorSchemeLabel = document.createElement("h4");
    colorSchemeLabel.textContent = "Color Scheme";

    const colorSchemeSelect = document.createElement("select");
    colorSchemeSelect.id = "color-theme";
    colorSchemeSelect.className = "dropdown";

    const lightOption = document.createElement("option");
    lightOption.value = "light";
    lightOption.textContent = "Light Mode";

    const darkOption = document.createElement("option");
    darkOption.value = "dark";
    darkOption.textContent = "Dark Mode";

    colorSchemeSelect.appendChild(lightOption);
    colorSchemeSelect.appendChild(darkOption);

    colorSchemeContainer.appendChild(colorSchemeLabel);
    colorSchemeContainer.appendChild(colorSchemeSelect);

    popup.appendChild(closeButton);
    popup.appendChild(header);
    popup.appendChild(userModeContainer);
    popup.appendChild(colorSchemeContainer);

    overlay.appendChild(popup);
    this._container.appendChild(overlay);

    // add the event listeners
    userModeCheckbox.addEventListener("click", () => {
      proofFlow.switchUserMode();
    });

    closeButton.addEventListener("click", () => this.showOverlay(false));

    colorSchemeSelect.addEventListener("change", (e) => {
      const target = e.target as HTMLSelectElement;
      updateColors(target.value);
    });

    return overlay;
  }

  public showOverlay(visible: boolean) {
    console.log("showing overlay: " + visible);
    this._overlay.style.display = visible ? "flex" : "none";
  }
}
