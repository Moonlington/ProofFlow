import { deleteSelection, newlineInCode } from "prosemirror-commands";
import { keymap } from "prosemirror-keymap";
import { Schema } from "prosemirror-model";
import {
  EditorState,
  Plugin,
  TextSelection,
  Transaction,
} from "prosemirror-state";
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
import { InsertionPlace, getContainingNode } from "../commands/helpers.ts";
import { collapsibleAreaPlugin } from "../collapsiblearea.ts";
import { markdownPlugin } from "../plugins/plugin-markdown.ts";
import { EditorView } from "prosemirror-view";
// Create input rules using default regex
const blockMathInputRule = makeBlockMathInputRule(
  REGEX_BLOCK_MATH_DOLLARS,
  ProofFlowSchema.nodes.math_display,
);
import { proofFlow } from "../../main.ts";
import { UserMode } from "../UserMode/userMode.ts";

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

  plugins.push(collapsibleAreaPlugin);

  // Add markdown plugin
  plugins.push(markdownPlugin);

  // Add keymap plugin with keybindings for various commands
  plugins.push(
    keymap({
      Tab: (state, dispatch) => {
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
    }),
  );

  // Add input rules plugin with block math input rule
  plugins.push(inputRules({ rules: [blockMathInputRule] }));

  // Add history plugin
  plugins.push(history());

  return plugins;
}

// Arrow key handler with type definitions
const arrowKeyHandler = (direction: "up" | "down" | "left" | "right") => {
  return (
    state: EditorState,
    dispatch?: (tr: Transaction) => void,
    view?: EditorView,
  ): boolean => {
    const { selection } = state;
    const { $from } = selection;
    const userMode = proofFlow.userMode;
    const node = $from.node($from.depth);

    if (node.type.name !== "markdown") {
      return true;
    }

    const inStudentMode = userMode === UserMode.Student;

    const containingNode = getContainingNode(selection);
    const inInput = containingNode?.type.name === "input_content";

    if (inStudentMode && inInput) {
      const block = view!.endOfTextblock(direction);
      const isFirstChild = containingNode?.firstChild === node;
      if ((direction === "up" || direction === "left") && isFirstChild) {
        return block;
      }
      const isLastChild = containingNode?.lastChild === node;
      if ((direction === "down" || direction === "right") && isLastChild) {
        return block;
      }
    }
    return false;
  };
};
