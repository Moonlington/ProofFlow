import { ProofFlow } from "../editor/ProofFlow";

export interface lspClientManager {
    setLspType(pf: ProofFlow): void;
    getLspType(): string;

    getLspPath(): string;
    setLspPath(pf: ProofFlow): void;
}

