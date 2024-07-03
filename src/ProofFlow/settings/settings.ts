import {
  createColorSchemeContainer,
  createLspContainer,
  createMiniMapContainer,
  createTextStyleContainer,
  createUserModeContainer,
} from "./createSettingContainers";
import { createSettingsMenu } from "./elementCreation";

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
    const popup = createSettingsMenu();
    const userModeContainer = createUserModeContainer();
    const colorSchemeContainer = createColorSchemeContainer();
    const miniMapContainer = createMiniMapContainer();
    const lspContainer = createLspContainer();
    const textStyleContainer = createTextStyleContainer();

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
}
