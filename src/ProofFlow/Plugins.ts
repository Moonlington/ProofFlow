import { deleteSelection, newlineInCode } from "prosemirror-commands";
import { keymap } from "prosemirror-keymap";
import { Schema } from "prosemirror-model";
import { Plugin } from "prosemirror-state";
import { mathPlugin } from "@benrbray/prosemirror-math";
import { inputRules } from "prosemirror-inputrules";
import {
  makeBlockMathInputRule,
  REGEX_BLOCK_MATH_DOLLARS,
} from "@benrbray/prosemirror-math";
import { ProofFlowSchema } from "./ProofFlowSchema";
import {
  cmdInsertCode,
  cmdInsertMarkdown,
  cmdInsertMath,
} from "./commands/commands";
import { InsertionPlace } from "./commands/helpers";

// create input rules (using default regex)
let blockMathInputRule = makeBlockMathInputRule(
  REGEX_BLOCK_MATH_DOLLARS,
  ProofFlowSchema.nodes.math_display,
);

export function createPlugins(schema: Schema): Plugin[] {
  let plugins = new Array<Plugin>();

  plugins.push(mathPlugin);
  plugins.push(
    keymap({
      Backspace: deleteSelection,
      Delete: deleteSelection,
      Enter: newlineInCode, // This only works in code sections
      "Mod-m": cmdInsertMarkdown(schema, InsertionPlace.Underneath),
      "Mod-M": cmdInsertMarkdown(schema, InsertionPlace.Above),
      "Mod-q": cmdInsertCode(schema, InsertionPlace.Underneath),
      "Mod-Q": cmdInsertCode(schema, InsertionPlace.Above),
      "Mod-l": cmdInsertMath(schema, InsertionPlace.Underneath),
      "Mod-L": cmdInsertMath(schema, InsertionPlace.Above),
    }),
  );
  plugins.push(inputRules({ rules: [blockMathInputRule] }));
  return plugins;
}
