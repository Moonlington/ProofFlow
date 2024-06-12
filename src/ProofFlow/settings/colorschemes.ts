interface ColorSchemes {
  [key: string]: string[];
}

const colorSchemes: ColorSchemes = {
  light: [
    "#EAEFF2", // primary-color
    "#00E0D4", // secondary-color
    "#FF4500", // tertiary-color
    "#d5dee7", // quaternary-color
    "#1cf5ea", // highlight
    "#00e0d52c", // hover
    "#000000", // text-color
    "#000000", // button-text-color
    "rgba(0, 0, 0, 0.3)", // popup-shadow
  ],
  dark: [
    "#1A1A1A", // primary-color
    "#FFE0D4", // secondary-color
    "#FF4500", // tertiary-color
    "#3e3e3e", // quaternary-color
    "#1cf5ea", // highlight
    "#00e0d52c", // hover
    "#FFFFFF", // text-color
    "#FFFFFF", // button-text-color
    "rgba(0, 0, 0, 0.3)", // popup-shadow
  ],
};

export function updateColors(newSchema: string): void {
  const variables: string[] = [
    "primary-color",
    "secondary-color",
    "tertiary-color",
    "quaternary-color",
    "highlight",
    "hover",
    "text-color",
    "button-text-color",
    "popup-shadow",
  ];

  const colors: string[] | undefined = colorSchemes[newSchema];
  if (!colors) {
    console.error(`Color scheme "${newSchema}" not found.`);
    return;
  }

  variables.forEach((element, index) => {
    document.documentElement.style.setProperty(`--${element}`, colors[index]);
  });
}
