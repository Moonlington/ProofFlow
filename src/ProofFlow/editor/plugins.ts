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
} from "../commands/commands.ts";
import { InsertionPlace } from "../commands/helpers.ts";
import { collapsibleAreaPlugin } from "../plugins/plugin-collapsible.ts";
import { markdownPlugin } from "../plugins/plugin-markdown.ts";
import { arrowKeyHandler } from "../commands/arrowKeyHandler.ts";
import { preventDropPlugin } from "../plugins/prevent-drop.ts";

// Create input rules using default regex
const blockMathInputRule = makeBlockMathInputRule(
  REGEX_BLOCK_MATH_DOLLARS,
  ProofFlowSchema.nodes.math_display,
);

// TODO: Documentation
/**
 * Array of plugins used in the ProofFlow editor.
 * @type {Plugin[]}
 */
export const ProofFlowPlugins: Plugin[] = [
  mathPlugin,
  collapsibleAreaPlugin,
  markdownPlugin,
  preventDropPlugin,
  keymapPlugin(ProofFlowSchema),
  inputRules({ rules: [blockMathInputRule] }),
  history(),
];

/**
 * Creates a keymap plugin for the given schema.
 *
 * @param schema The schema to create plugins for.
 * @returns A keymap plugin.
 */
function keymapPlugin(schema: Schema): Plugin {
  return keymap({
    Tab: (state, dispatch) => {
      // Insert a tab character
      if (dispatch) {
        dispatch(state.tr.insertText("\t"));
      }
      return true;
    },
    Backspace: deleteSelection,
    Delete: deleteSelection,
    Enter: newlineInCode, // This only works in code sections
    "Mod-m": cmdInsertMarkdown(schema, InsertionPlace.Underneath),
    "Mod-M": cmdInsertMarkdown(schema, InsertionPlace.Above),
    "Mod-q": cmdInsertCode(schema, InsertionPlace.Underneath),
    "Mod-Q": cmdInsertCode(schema, InsertionPlace.Above),
    "Mod-l": cmdInsertMath(schema, InsertionPlace.Underneath),
    "Mod-L": cmdInsertMath(schema, InsertionPlace.Above),
    ArrowLeft: arrowKeyHandler("left"),
    ArrowUp: arrowKeyHandler("up"),
    ArrowRight: arrowKeyHandler("right"),
    ArrowDown: arrowKeyHandler("down"),
    "Mod-ArrowLeft": arrowKeyHandler("left"),
    "Mod-ArrowUp": arrowKeyHandler("up"),
    "Mod-ArrowRight": arrowKeyHandler("right"),
    "Mod-ArrowDown": arrowKeyHandler("down"),
  });
}
