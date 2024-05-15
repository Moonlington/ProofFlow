import { Schema } from "prosemirror-model";
import { Command } from "prosemirror-state";
import { InsertionPlace, insertAbove, insertUnder } from "./helpers";
import {
  getCodeInsertCommand,
  getMathInsertCommand,
  getMdInsertCommand,
} from "./insert-commands";

/**
 * Returns the appropriate insertion function based on the specified place.
 * @param place - The insertion place.
 * @returns The insertion function.
 */
function getInsertionFunction(place: InsertionPlace) {
  return place == InsertionPlace.Above ? insertAbove : insertUnder;
}

/**
 * Inserts code into the specified schema at the given insertion place.
 * @param schema - The schema to insert the code into.
 * @param insertionPlace - The place where the code should be inserted.
 * @returns The command to insert the code.
 */
export function cmdInsertCode(
  schema: Schema,
  insertionPlace: InsertionPlace,
): Command {
  const codeblockNodeType = schema.nodes["code_mirror"];
  return getCodeInsertCommand(
    getInsertionFunction(insertionPlace),
    codeblockNodeType,
  );
}

/**
 * Inserts a markdown node into the schema at the specified insertion place.
 *
 * @param schema - The schema to insert the markdown node into.
 * @param insertionPlace - The insertion place where the markdown node should be inserted.
 * @returns The command object representing the insertion of the markdown node.
 */
export function cmdInsertMarkdown(
  schema: Schema,
  insertionPlace: InsertionPlace,
): Command {
  const mdNodeType = schema.nodes["markdown"];
  return getMdInsertCommand(getInsertionFunction(insertionPlace), mdNodeType);
}

/**
 * Inserts a math node into the schema at the specified insertion place.
 *
 * @param schema - The schema to insert the math node into.
 * @param insertionPlace - The insertion place where the math node should be inserted.
 * @returns The command to insert the math node.
 */
export function cmdInsertMath(
  schema: Schema,
  insertionPlace: InsertionPlace,
): Command {
  const mathNodeType = schema.nodes["math_display"];
  return getMathInsertCommand(
    getInsertionFunction(insertionPlace),
    mathNodeType,
  );
}
