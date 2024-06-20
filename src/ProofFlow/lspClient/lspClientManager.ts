import { ProofFlowLSPClientFileType } from "./ProofFlowLSPClient";
import { LSPClientHandler } from "./lspClientHandler";

export interface LSPClientManager {
  getLSP(type: ProofFlowLSPClientFileType): LSPClientHandler;
}
