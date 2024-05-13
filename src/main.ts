import { ProofFlow } from "./ProofFlow/ProofFlow";
import {
  AcceptedFileTypes,
  isCorrectFileType,
} from "./ProofFlow/parser/accepted-file-types";
import "./index.css";
import "@benrbray/prosemirror-math/dist/prosemirror-math.css";
import "katex/dist/katex.min.css";

let editorElement: HTMLElement = document.querySelector("#editor")!;
let contentElement: HTMLElement = document.querySelector("#content")!;

let proofFlow: ProofFlow = new ProofFlow(editorElement, contentElement);

let buttonNewInstance = document.getElementById("newtextblock");
buttonNewInstance?.addEventListener("click", (e) => {
  while (editorElement.firstChild != null) {
    editorElement.removeChild(editorElement.firstChild);
  }
  while (contentElement.firstChild != null) {
    contentElement.removeChild(contentElement.firstChild);
  }
  proofFlow = new ProofFlow(editorElement, contentElement);
});

let buttonInsertHi = document.getElementById("insert-hi");
buttonInsertHi?.addEventListener("click", (e) => {
  proofFlow.createTextArea("hi");
});

// Input to read file
document
  .getElementById("file-input")
  ?.addEventListener("change", readSingleFile, false);

// Reads a file and checks if the format is correct, if so it sends it to the editor to open it
function readSingleFile(e: Event) {
  if (!e.target) return;
  let fileList = (<HTMLInputElement>e.target).files;
  if (!fileList) return;
  let file = fileList[0];
  let fileType = isCorrectFileType(file);
  if (fileType === AcceptedFileTypes.Unknown) {
    console.log("Sorry, this file type is currently not supported");
    return;
  }
  let reader = new FileReader();
  reader.readAsText(file, "UTF-8");
  reader.onloadend = (readerEvent: ProgressEvent<FileReader>) => {
    if (readerEvent?.target?.result) {
      let result = readerEvent.target.result.toString();
      proofFlow.openOriginalCoqFile(result);
    }
  };
}
