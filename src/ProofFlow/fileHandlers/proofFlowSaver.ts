import { ProofFlow } from "../editor/ProofFlow";

export interface ProofFlowSaver {
  save(pf: ProofFlow): void;
}
