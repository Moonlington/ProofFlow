import { ProofFlow } from "./ProofFlow/editor/ProofFlow.ts";
import {
  AcceptedFileType,
  isCorrectFileType,
} from "./ProofFlow/parser/accepted-file-types";
import "./styles/main.css";
import "@benrbray/prosemirror-math/dist/prosemirror-math.css";
import "katex/dist/katex.min.css";
import { reloadColorScheme } from "./ProofFlow/settings/updateColors.ts";
import { SettingsOverlay } from "./ProofFlow/settings/settings.ts";
import { handleUserModeSwitch } from "./ProofFlow/UserMode/userMode.ts";
import { WebApplicationSaver } from "./ProofFlow/fileHandlers/webApplicationSaver.ts";
import { WebApplicationLSPManager } from "./ProofFlow/lspClient/webApplicationManager.ts";
import { ProofFlowSaver } from "./ProofFlow/fileHandlers/proofFlowSaver.ts";
import { VSCodeSaver } from "./ProofFlow/fileHandlers/vscodeSaver.ts";
import { vscode } from "./ProofFlow/extension/vscode.ts";
import { renderAllMarkdown } from "./ProofFlow/plugins/markdown-extra.ts";
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

export let firefoxUsed =
  navigator.userAgent.toLowerCase().indexOf("firefox") > -1;

// Check if we are in a VSCode Extension Environment; base filesaver on that
let fileSaver: any; // Need any type to be able to call syncPfDoc for the VSCodeSaver
let inVSCode = vscode.isVSCodeEnvironment();
fileSaver = inVSCode ? new VSCodeSaver() : new WebApplicationSaver();

// Create a new instance of the ProofFlow class
let proofFlow: ProofFlow = new ProofFlow({
  editorElem: editor,
  containerElem: container,
  fileSaver: fileSaver,
  lspManager: new WebApplicationLSPManager(
    "ws://localhost:8080",
    window.localStorage,
  ),
});

// Sync the PF document with VSCode (if we are in VSCode)
if (inVSCode) fileSaver.syncPfDoc(proofFlow);

// Create the settings overlay
const settingsOverlay = new SettingsOverlay(container);

// Export the proofFlow instance
export { proofFlow };

// Ensure that the user mode is correctly set
handleUserModeSwitch();

// Update the color scheme
reloadColorScheme();

// Add event listener to the editor to render all markdown nodes
editor.addEventListener("click", () => {
  renderAllMarkdown(proofFlow);
});

// prevent user from leaving the page without saving
window.onbeforeunload = function () {
  return "Are you sure you want to leave? You may have unsaved changes.";
};

export function showOverlay(bool: boolean) {
  settingsOverlay.showOverlay(bool);
}

export function adjustLeftDivWidth() {
  const rightDiv = document.getElementById("miniMapContainer")!;
  const leftDiv = document.getElementById("ProofFlowEditor")!;
  const windowWidth = window.innerWidth;
  const rightDivWidth = rightDiv.offsetWidth;
  leftDiv.style.width = windowWidth - rightDivWidth - 12 + "px";
}

window.addEventListener("resize", adjustLeftDivWidth);
window.addEventListener("load", adjustLeftDivWidth);

/**
 * Reads a single file from the input event and processes it.
 * @param e - The input event.
 */
export async function readSingleFile(e: Event) {
  // Wait for user confirmation
  const confirmed = await proofFlow.requestConfirm(
    "Are you sure you want to load a new file, this will delete the current instance.",
  );
  if (!confirmed) {
    proofFlow.resetButtonBar();
    return;
  }

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
    if (typeof readerEvent?.target?.result === "string") {
      // Get the result from the reader event
      const result = readerEvent.target.result.toString();
      proofFlow.reset();
      proofFlow.setFileName(file.name);
      proofFlow.openFile(result, fileType);
      handleUserModeSwitch();
    }
  };
}
