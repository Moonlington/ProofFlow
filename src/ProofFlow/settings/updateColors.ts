import { colorSchemes } from "./colorschemes";

/**
 * Array of keys for the color schemes.
 */
export const colorSchemesKeys: string[] = Object.keys(colorSchemes);

/**
 * Array of color variables used for updating colors.
 */
const variables: string[] = [
  "primary-color",
  "secondary-color",
  "tertiary-color",
  "highlight",
  "hover",
  "text-color",
  "button-text-color",
];

/**
 * Updates the colors of the application based on the selected color scheme and dark mode setting.
 * @param newSchema - The name of the color scheme to apply.
 * @param darkMode - A boolean indicating whether dark mode is enabled.
 */
export function updateColors(newSchema: string, darkMode: boolean): void {
  // Get the colors for the new color scheme
  const colors: string[] | undefined = colorSchemes[newSchema];
  if (!colors) {
    console.error(`Color scheme "${newSchema}" not found.`);
    return;
  }

  // Colors that need to be inverted in dark mode
  const toBeInverted = ["primary-color", "text-color"];

  // Update the colors
  variables.forEach((element, index) => {
    let color;
    if (darkMode && toBeInverted.includes(element)) {
      color = invertHexColor(colors[index]);
    } else {
      color = colors[index];
    }
    // For everything
    document.documentElement.style.setProperty(`--${element}`, color);
    // For Minimap D;
    document
      .getElementById("ProofFlowEditor")!
      .style.setProperty(`--${element}`, color);
  });

  // Update the background color of the settings overlay
  document.getElementById("settings")!.style.backgroundColor = darkMode
    ? "#FFFFFF0A"
    : "#0000000A";
}

/**
 * Inverts a hex color.
 *
 * @param hex - The hex color to invert.
 * @returns The inverted color in hex format.
 */
function invertHexColor(hex: string): string {
  // Convert hex to RGB
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Invert the colors
  const invertedR = (255 - r).toString(16).padStart(2, "0");
  const invertedG = (255 - g).toString(16).padStart(2, "0");
  const invertedB = (255 - b).toString(16).padStart(2, "0");

  // Return the inverted color in hex format
  if (hex.length === 9)
    return `#${invertedR}${invertedG}${invertedB}${hex[6]}${hex[7]}`;
  return `#${invertedR}${invertedG}${invertedB}`;
}

/**
 * Reloads the color scheme based on the user's preferences stored in the local storage.
 * If the user has enabled dark mode, it retrieves the color scheme and applies it.
 * If the user has not enabled dark mode, it uses the default color scheme "Ocean Breeze".
 */
export function reloadColorScheme() {
  const darkMode = window.localStorage.getItem("darkMode") == "true";
  const colorScheme =
    window.localStorage.getItem("colorScheme") || "Ocean Breeze";
  updateColors(colorScheme, darkMode);
}
