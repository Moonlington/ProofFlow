import { ProofFlowSchema } from "./proofflowschema.ts";

export const mathblockNodeType = ProofFlowSchema.nodes["math_display"];
export const codeblockNodeType = ProofFlowSchema.nodes["code_mirror"];
export const collapsibleNodeType = ProofFlowSchema.nodes["collapsible"];
export const collapsibleContentType =
  ProofFlowSchema.nodes["collapsible_content"];
export const collapsibleTitleNodeType =
  ProofFlowSchema.nodes["collapsible_title"];
export const markdownblockNodeType = ProofFlowSchema.nodes["markdown"];
export const inputNodeType = ProofFlowSchema.nodes["input"];
export const inputContentType = ProofFlowSchema.nodes["input_content"];
