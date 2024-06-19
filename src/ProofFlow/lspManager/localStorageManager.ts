export { localStorageManager };
import { ProofFlow } from "../editor/ProofFlow";
import { lspClientManager } from "../lspManager/lspClientManager";

/**
 * LocalStorageManager is responsible for managing the local storage of the ProofFlow
 * document.
 */
class localStorageManager implements lspClientManager {
    constructor() {}

    setLspType(pf: ProofFlow): void {
        localStorage.setItem("lspType", pf.lspType);
    }

    setLspPath(pf: ProofFlow): void {
        localStorage.setItem("lspPath", pf.lspPath);
    }

    getLspType(): string {
        return localStorage.getItem("currentLspType") || "";
    }

    getLspPath(): string {
        return localStorage.getItem("lspPath") || "";
    }
}