export { WebApplicationSaver };
import { ProofFlow } from "../editor/ProofFlow";
import { ProofFlowSaver } from "./proofFlowSaver";

class WebApplicationSaver implements ProofFlowSaver {
  constructor() {}
  save(pf: ProofFlow): void {
    const result = pf.pfDocument.toString();
    const blob = new Blob([result], { type: "text" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = pf.fileName;
    document.body.appendChild(a);
    a.click();

    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}
