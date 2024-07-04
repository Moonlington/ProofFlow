import { Command } from "prosemirror-state";
import { InsertionPlace, insertAbove, insertUnder } from "./helpers";
import {
  getCodeInsertCommand,
  getMathInsertCommand,
  getMdInsertCommand,
} from "./insert-commands";
import { ProofFlowSchema } from "../editor/Schema/proofFlowSchema";
import { ProofFlow } from "../editor/ProofFlow";

/**
 * Returns the appropriate insertion function based on the specified place.
 * @param place - The insertion place.
 * @returns The insertion function.
 */
export function getInsertionFunction(place: InsertionPlace) {
  return place == InsertionPlace.Above ? insertAbove : insertUnder;
}

/**
 * Inserts code into the specified schema at the given insertion place.
 * @param schema - The schema to insert the code into.
 * @param insertionPlace - The place where the code should be inserted.
 * @returns The command to insert the code.
 */
export function cmdInsertCode(proofFlow: ProofFlow, insertionPlace: InsertionPlace): Command {
  const codeblockNodeType = ProofFlowSchema.nodes["code_mirror"];
  return getCodeInsertCommand(
    proofFlow,
    getInsertionFunction(insertionPlace),
    codeblockNodeType,
  );
}

/**
 * Inserts a markdown node into the schema at the specified insertion place.
 *
 * @param insertionPlace - The insertion place where the markdown node should be inserted.
 * @returns The command object representing the insertion of the markdown node.
 */
export function cmdInsertMarkdown(proofFlow: ProofFlow, insertionPlace: InsertionPlace): Command {
  const mdNodeType = ProofFlowSchema.nodes["markdown"];
  return getMdInsertCommand(
    proofFlow,getInsertionFunction(insertionPlace), mdNodeType);
}

/**
 * Inserts a math node into the schema at the specified insertion place.
 *
 * @param insertionPlace - The insertion place where the math node should be inserted.
 * @returns The command to insert the math node.
 */
export function cmdInsertMath(proofFlow: ProofFlow, insertionPlace: InsertionPlace): Command {
  const mathNodeType = ProofFlowSchema.nodes["math_display"];
  return getMathInsertCommand(
    proofFlow,
    getInsertionFunction(insertionPlace),
    mathNodeType,
  );
}
