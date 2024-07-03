export { WebApplicationLSPManager };
import {
  ProofFlowLSPClient,
  ProofFlowLSPClientFileType,
} from "./ProofFlowLSPClient";
import { LSPClientHandler } from "./lspClientHandler";
import { LSPClientManager } from "./lspClientManager";

/**
 * LSP manager for web applications
 */
class WebApplicationLSPManager implements LSPClientManager {
  private wsUrl: string;
  private localStorage: Storage;

  constructor(wsUrl: string, localStorage: Storage) {
    this.wsUrl = wsUrl;
    this.localStorage = localStorage;
  }

  /**
   * Get an LSP client for a given file type
   * @param type The file type
   * @returns The LSP client
   */
  getLSP(type: ProofFlowLSPClientFileType): LSPClientHandler {
    return new ProofFlowLSPClient(this.wsUrl, type, this.getPath(type));
  }

  /**
   * Get the path for a given file type
   * @param type The file type
   * @returns The path
   */
  getPath(type: ProofFlowLSPClientFileType): string {
    return JSON.parse(this.localStorage.getItem(type) || "{}").path || "";
  }
}
