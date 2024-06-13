import { handleUserModeSwitch } from "./ProofFlow/UserMode/userMode.ts";
import { ProofFlow } from "./ProofFlow/editor/ProofFlow.ts";
import {
  AcceptedFileType,
  isCorrectFileType,
} from "./ProofFlow/parser/accepted-file-types";
import "./styles/styles.css";
import "@benrbray/prosemirror-math/dist/prosemirror-math.css";
import "katex/dist/katex.min.css";
import { SettingsOverlay } from "./ProofFlow/settings/settings.ts";
import { SettingsBar } from "./ProofFlow/settings/settingsBar.ts";

const app = document.createElement("div");
app.id = "app";

// Append the app to the body
document.body.appendChild(app);

// Create a container for the editor and content elements
const container = document.createElement("div");
container.id = "container";
app.appendChild(container);

const editor = document.createElement("div");
editor.id = "editor";
container.appendChild(editor);

const content = document.createElement("div");
content.id = "content";
container.appendChild(content);

// Create a new instance of the ProofFlow class
let proofFlow: ProofFlow = new ProofFlow(editor, content);
export { proofFlow };

const settingsOverlay = new SettingsOverlay(container);

const settingBar = new SettingsBar(
  content,
  settingsOverlay,
  proofFlow.getEditorView(),
);

// Do this to get proper user rights.
handleUserModeSwitch();

// Input to read file
document
  .getElementById("file-input")
  ?.addEventListener("change", readSingleFile, false);

/**
 * Reads a single file from the input event and processes it.
 * @param e - The input event.
 */
function readSingleFile(e: Event) {
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
      proofFlow.setFileName(file.name);
      proofFlow.openFile(result, fileType);
    }
  };
}
