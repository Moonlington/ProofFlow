import { ProofFlow } from "./ProofFlow/editor/ProofFlow.ts";
import {
  AcceptedFileTypes,
  isCorrectFileType,
} from "./ProofFlow/parser/accepted-file-types";
import "./ProofFlow/styles/ProofFlow.css";
import "./ProofFlow/styles/index.css";
import "@benrbray/prosemirror-math/dist/prosemirror-math.css";
import "katex/dist/katex.min.css";

// Get the editor and content elements
const editorElement: HTMLElement = document.querySelector("#editor")!;
const contentElement: HTMLElement = document.querySelector("#content")!;

// Create a new instance of the ProofFlow class
let proofFlow: ProofFlow = new ProofFlow(editorElement, contentElement);

// Button to create a new instance of the editor and content elements
const buttonNewInstance = document.getElementById("newtextblock");
// Add event listener to the button
buttonNewInstance?.addEventListener("click", (e) => {
  // Remove all children from the editor element
  while (editorElement.firstChild != null) {
    editorElement.removeChild(editorElement.firstChild);
  }

  // Remove all children from the content element
  while (contentElement.firstChild != null) {
    contentElement.removeChild(contentElement.firstChild);
  }

  // Create a new instance of the ProofFlow class
  proofFlow = new ProofFlow(editorElement, contentElement);
});

// Button to insert "hi" in the editor element
// TODO: remove this button, it's just for testing
const buttonInsertHi = document.getElementById("insert-hi");
buttonInsertHi?.addEventListener("click", (e) => {
  proofFlow.createTextArea("hi");
});

let buttonSaveFile = document.getElementById("save-file");
buttonSaveFile?.addEventListener("click", (e) => {
  proofFlow.saveFile();
});

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
  if (fileType === AcceptedFileTypes.Unknown) {
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

      // Process the file content
      if (fileType == AcceptedFileTypes.Coq) {
        proofFlow.openOriginalCoqFile(result);
      } else if (fileType == AcceptedFileTypes.CoqMD) {
        proofFlow.openMarkdownCoqFile(result);
      } else if (fileType == AcceptedFileTypes.Lean) {
        proofFlow.openLeanFile(result);
      }
    }
  };
}
