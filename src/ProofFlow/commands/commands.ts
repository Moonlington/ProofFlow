import { Schema } from "prosemirror-model";
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
  schema: Schema,
  insertionPlace: InsertionPlace,
): Command {
  const codeblockNodeType = schema.nodes["codecell"];
  return getCodeInsertCommand(
    getInsertionFunction(insertionPlace),
    codeblockNodeType,
  );
}

export function cmdInsertMarkdown(
  schema: Schema,
  insertionPlace: InsertionPlace,
): Command {
  const mdNodeType = schema.nodes["markdown"];
  return getMdInsertCommand(getInsertionFunction(insertionPlace), mdNodeType);
}

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
