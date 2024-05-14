import { ProofFlow } from "./ProofFlow/ProofFlow";
import {
  AcceptedFileTypes,
  isCorrectFileType,
} from "./ProofFlow/parser/accepted-file-types";
import "./ProofFlow.css";
import "./index.css";
import "@benrbray/prosemirror-math/dist/prosemirror-math.css";
import "katex/dist/katex.min.css";

// Get the editor and content elements
let editorElement: HTMLElement = document.querySelector("#editor")!;
let contentElement: HTMLElement = document.querySelector("#content")!;

// Create a new instance of the ProofFlow class
let proofFlow: ProofFlow = new ProofFlow(editorElement, contentElement);

// Button to create a new instance of the editor and content elements
let buttonNewInstance = document.getElementById("newtextblock");
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
// TODO remove this button, It's just for testing
let buttonInsertHi = document.getElementById("insert-hi");
buttonInsertHi?.addEventListener("click", (e) => {
  proofFlow.createTextArea("hi");
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
  let fileList = (<HTMLInputElement>e.target).files;
  if (!fileList) return;

  // Get the first file from the list and check if it's a correct file type
  let file = fileList[0];
  let fileType = isCorrectFileType(file);
  if (fileType === AcceptedFileTypes.Unknown) {
    console.log("Sorry, this file type is currently not supported");
    return;
  }

  // Create a new file reader and read the file content
  let reader = new FileReader();
  reader.readAsText(file, "UTF-8");

  // Event listener to process the file content
  reader.onloadend = (readerEvent: ProgressEvent<FileReader>) => {
    if (readerEvent?.target?.result) {
      // Get the result from the reader event
      let result = readerEvent.target.result.toString();

      // Process the file content
      proofFlow.openOriginalCoqFile(result);
    }
  };
}
