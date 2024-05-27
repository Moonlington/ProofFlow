import { deleteSelection, newlineInCode } from "prosemirror-commands";
import { keymap } from "prosemirror-keymap";
import { Schema } from "prosemirror-model";
import { Plugin } from "prosemirror-state";
import { mathPlugin } from "@benrbray/prosemirror-math";
import { history } from "prosemirror-history";
import { inputRules } from "prosemirror-inputrules";
import {
  makeBlockMathInputRule,
  REGEX_BLOCK_MATH_DOLLARS,
} from "@benrbray/prosemirror-math";
import { ProofFlowSchema } from "./proofflowschema.ts";
import {
  cmdInsertCode,
  cmdInsertMarkdown,
  cmdInsertMath,
} from "./commands/commands";
import { InsertionPlace } from "./commands/helpers";
import { testPlugin } from "./plugins/plugin-markdown.ts";

// Create input rules using default regex
const blockMathInputRule = makeBlockMathInputRule(
  REGEX_BLOCK_MATH_DOLLARS,
  ProofFlowSchema.nodes.math_display,
);

/**
 * Creates an array of plugins for the given schema.
 *
 * @param schema - The schema to create plugins for.
 * @returns An array of plugins.
 */
export function createPlugins(schema: Schema): Plugin[] {
  const plugins = [];

  // Add math plugin
  plugins.push(mathPlugin);

  // Add test plugin
  plugins.push(testPlugin);
  
  // Add keymap plugin with keybindings for various commands
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

  // Add input rules plugin with block math input rule
  plugins.push(inputRules({ rules: [blockMathInputRule] }));

  // Add history plugin
  plugins.push(history());

  return plugins;
}
