import { showOverlay } from "../../main";

/**
 * Creates an HTML label element with the specified text and "for" attribute.
 * @param text - The text content of the label.
 * @param htmlFor - The value of the "for" attribute, specifying the ID of the associated form element.
 * @returns The created HTML label element.
 */
export function createLabel(text: string, htmlFor: string): HTMLLabelElement {
  const label = document.createElement("label");
  label.textContent = text;
  label.htmlFor = htmlFor;
  label.classList.add("checkbox");

  return label;
}

/**
 * Creates a checkbox element.
 *
 * @returns The created checkbox element.
 */
export function createCheckbox(
  id: string,
  commandHandler: (e: Event) => void,
): HTMLInputElement {
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id = id;
  checkbox.classList.add("checkbox");

  // Add event listener
  checkbox.addEventListener("click", (e) => commandHandler(e));

  return checkbox;
}

/**
 * Creates a container element with the specified header.
 *
 * @param header - The text content for the container header.
 * @returns The created container element.
 */
export function createContainer(header: string): HTMLElement {
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
export function createDropdown(
  options: string[],
  commandHandler: (e: Event) => void,
): HTMLSelectElement {
  const dropdown = document.createElement("select");
  dropdown.className = "dropdown";

  options.forEach((option) => {
    const optionElement = document.createElement("option");
    optionElement.value = option;
    optionElement.textContent = option;
    dropdown.appendChild(optionElement);
  });

  dropdown.addEventListener("change", (e) => commandHandler(e));

  return dropdown;
}

/**
 * Creates and returns a close button element.
 * The close button is used to close the settings overlay.
 *
 * @returns The close button element.
 */
export function createCloseButton(): HTMLButtonElement {
  const closeButton = document.createElement("button");
  closeButton.className = "close-button";
  closeButton.id = "close-settings";
  closeButton.innerHTML = "&#x2715;";

  closeButton.addEventListener("click", () => showOverlay(false));

  return closeButton;
}

/**
 * Creates and returns the settings menu element.
 *
 * @returns The settings menu element as an HTMLElement.
 */
export function createSettingsMenu(): HTMLElement {
  // Create the popup
  const popup = document.createElement("div");
  popup.className = "popup";

  // Add close button
  const closeButton = createCloseButton();
  popup.appendChild(closeButton);

  // Add text header
  const header = document.createElement("h2");
  header.textContent = "Settings Menu";
  popup.appendChild(header);

  return popup;
}
