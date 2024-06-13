import { colorSchemes } from "./colorSchemes";

export const colorSchemesKeys: string[] = Object.keys(colorSchemes);

export function updateColors(newSchema: string, darkMode: boolean): void {
  const variables: string[] = [
    "primary-color",
    "secondary-color",
    "tertiary-color",
    "highlight",
    "hover",
    "text-color",
    "button-text-color",
  ];

  const colors: string[] | undefined = colorSchemes[newSchema];
  if (!colors) {
    console.error(`Color scheme "${newSchema}" not found.`);
    return;
  }

  const toBeInverted = ["primary-color", "text-color"];

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
    document
      .getElementById("button-bar")!
      .style.setProperty(`--${element}`, color);
  });

  document.getElementById("settings")!.style.backgroundColor = darkMode
    ? "#FFFFFF0A"
    : "#0000000A";
}

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
