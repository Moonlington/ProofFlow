export { VSCodeSaver };
import { ProofFlow } from "../editor/ProofFlow";
import { vscode } from "../extension/vscode";
import { ProofFlowSaver } from "./proofFlowSaver";

class VSCodeSaver implements ProofFlowSaver {
    constructor() {
        window.addEventListener("message", (event) => {
            const message = event.data;
            if (message.command === "openFile") {
                console.log("File opened: " + message.content);
            }
        });
    }

    save(pf: ProofFlow): void {
        const result = pf.pfDocument.toString();
        vscode.postMessage({
            command: "saveFile",
            content: result,
            text: "Saving file..."
        });
    }
}