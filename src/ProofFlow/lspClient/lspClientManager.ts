import { ProofFlowLSPClientFileType } from "./ProofFlowLSPClient";
import { LSPClientHandler } from "./lspClientHandler";

/**
 * Interface for managing LSP clients
 */
export interface LSPClientManager {
  getLSP(type: ProofFlowLSPClientFileType): LSPClientHandler;
}
