export { VSCodeSaver };
import { ProofFlow } from "../editor/ProofFlow";
import { vscode } from "../extension/vscode";
import { ProofFlowSaver } from "./proofFlowSaver";
import { AcceptedFileType } from "../parser/accepted-file-types";

/**
 * A class that saves proof flows to the VSCode editor.
 */
class VSCodeSaver implements ProofFlowSaver {
  constructor() {}

  save(pf: ProofFlow): void {
    const result = pf.pfDocument.toString();
    vscode.postMessage({
      command: "saveFile",
      content: result,
      text: "Saving file...",
    });
  }

  // Make sure the proofflow document is synced with VSCode,
  // so the state can be restored when accidentally closed by the user
  syncPfDoc(pf: ProofFlow) {
    sync(pf);
    addLoadFileListener(pf);
  }
}

/**
 * Synchronizes the ProofFlow document with the VSCode editor.
 * @param pf The ProofFlow instance.
 */
function sync(pf: ProofFlow) {
  vscode.postMessage({
    command: "syncFile",
    content: pf.pfDocument.toString(),
    text: pf.fileName,
  });
  setTimeout(sync, 1000, pf);
}

/**
 * Adds a listener for loading files.
 * @param pf The ProofFlow instance.
 */
function addLoadFileListener(pf: ProofFlow) {
  window.addEventListener("message", (event) => {
    const message = event.data;
    if (message.command === "loadFile") {
      pf.openFile(
        message.content,
        message.text.split(".").pop() as AcceptedFileType,
      );
    }
  });
}
