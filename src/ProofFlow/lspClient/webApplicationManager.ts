export { WebApplicationLSPManager };
import {
  ProofFlowLSPClient,
  ProofFlowLSPClientFileType,
} from "./ProofFlowLSPClient";
import { LSPClientHandler } from "./lspClientHandler";
import { LSPClientManager } from "./lspClientManager";

class WebApplicationLSPManager implements LSPClientManager {
  private wsUrl: string;
  private localStorage: Storage;

  constructor(wsUrl: string, localStorage: Storage) {
    this.wsUrl = wsUrl;
    this.localStorage = localStorage;
  }

  getLSP(type: ProofFlowLSPClientFileType): LSPClientHandler {
    return new ProofFlowLSPClient(this.wsUrl, type, this.getPath(type));
  }

  getPath(type: ProofFlowLSPClientFileType): string {
    return JSON.parse(this.localStorage.getItem(type) || "{}").path || "";
  }
}
