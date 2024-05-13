import { Proofflowschema } from "../proofflowschema.ts";
import { Command } from "prosemirror-state";
import { InsertionPlace, insertAbove, insertUnder } from "./helpers";
import {
  getCodeInsertCommand,
  getMathInsertCommand,
  getMdInsertCommand,
} from "./insert-commands";

function getInsertionFunction(place: InsertionPlace) {
  return place == InsertionPlace.Above ? insertAbove : insertUnder;
}

export function cmdInsertCode(
  schema: typeof Proofflowschema,
  insertionPlace: InsertionPlace,
): Command {
  const codeblockNodeType = schema.nodes["code_mirror"];
  return getCodeInsertCommand(
    getInsertionFunction(insertionPlace),
    codeblockNodeType,
  );
}

export function cmdInsertMarkdown(
  schema: typeof Proofflowschema,
  insertionPlace: InsertionPlace,
): Command {
  const mdNodeType = schema.nodes["markdown"];
  return getMdInsertCommand(getInsertionFunction(insertionPlace), mdNodeType);
}

export function cmdInsertMath(
  schema: typeof Proofflowschema,
  insertionPlace: InsertionPlace,
): Command {
  const mathNodeType = schema.nodes["math_display"];
  return getMathInsertCommand(
    getInsertionFunction(insertionPlace),
    mathNodeType,
  );
}
