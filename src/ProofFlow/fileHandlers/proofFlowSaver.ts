import { ProofFlow } from "../editor/ProofFlow";

/**
 * Interface for classes that save proof flows.
 */
export interface ProofFlowSaver {
  save(pf: ProofFlow): void;
}
