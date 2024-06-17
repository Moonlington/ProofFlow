import { ProofFlow } from "./ProofFlow/editor/ProofFlow.ts";
import {
  AcceptedFileType,
  isCorrectFileType,
} from "./ProofFlow/parser/accepted-file-types";
import "./styles/main.css";
import "@benrbray/prosemirror-math/dist/prosemirror-math.css";
import "katex/dist/katex.min.css";
import { reloadColorScheme } from "./ProofFlow/settings/updateColors.ts";
import { SettingsBar } from "./ProofFlow/settings/settingsBar.ts";
import { SettingsOverlay } from "./ProofFlow/settings/settings.ts";
import { handleUserModeSwitch } from "./ProofFlow/UserMode/userMode.ts";

const app = document.createElement("div");
app.id = "app";

// Append the app to the body
document.body.appendChild(app);

// Create a container for the editor and content elements
const container = document.createElement("div");
container.id = "container";
app.appendChild(container);

// Create the editor and content elements
const editor = document.createElement("div");
editor.id = "editor";
container.appendChild(editor);

const content = document.createElement("div");
content.id = "content";
container.appendChild(content);

// Create a new instance of the ProofFlow class
let proofFlow: ProofFlow = new ProofFlow(editor, content);

// Create the settings overlay
const settingsOverlay = new SettingsOverlay(container);

// Create the settings bar
createSettings();

// Export the proofFlow instance
export { proofFlow };

// Ensure that the user mode is correctly set
handleUserModeSwitch();

// Update the color scheme
reloadColorScheme();

// Input to read file
document
  .getElementById("file-input")
  ?.addEventListener("change", readSingleFile, false);

// prevent user from leaving the page without saving
window.onbeforeunload = function () {
  return "Are you sure you want to leave? You may have unsaved changes.";
};

/**
 * Creates the settings and initializes the settings bar.
 */
export function createSettings() {
  new SettingsBar(content, settingsOverlay, proofFlow.getEditorView());
}

/**
 * Reads a single file from the input event and processes it.
 * @param e - The input event.
 */
function readSingleFile(e: Event) {
  console.log("Reading file...");
  // Get the file list from the input event and check if it's empty
  if (!e.target) return;
  const fileList = (<HTMLInputElement>e.target).files;
  if (!fileList) return;

  // Get the first file from the list and check if it's a correct file type
  const file = fileList[0];
  const fileType = isCorrectFileType(file);
  if (fileType === AcceptedFileType.Unknown) {
    console.log("Sorry, this file type is currently not supported");
    return;
  }

  // Create a new file reader and read the file content
  const reader = new FileReader();
  reader.readAsText(file, "UTF-8");

  // Event listener to process the file content
  reader.onloadend = (readerEvent: ProgressEvent<FileReader>) => {
    if (readerEvent?.target?.result) {
      // Get the result from the reader event
      const result = readerEvent.target.result.toString();
      proofFlow.reset();
      proofFlow.setFileName(file.name);
      proofFlow.openFile(result, fileType);
    }
  };
}
