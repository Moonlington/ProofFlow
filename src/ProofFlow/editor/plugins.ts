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
import { collapsibleAreaPlugin } from "../plugins/plugin-collapsible.ts";
import { markdownPlugin } from "../plugins/plugin-markdown.ts";
import { EditorView } from "prosemirror-view";

// Create input rules using default regex
const blockMathInputRule = makeBlockMathInputRule(
  REGEX_BLOCK_MATH_DOLLARS,
  ProofFlowSchema.nodes.math_display,
);
import { proofFlow } from "../../main.ts";
import { UserMode } from "../UserMode/userMode.ts";

// Arrow key handler with type definitions
/**
 * Handles arrow key events in the editor.
 * @param direction - The direction of the arrow key ("up", "down", "left", or "right").
 * @returns A function that takes the editor state, dispatch function, and view, and returns a boolean indicating whether the arrow key event was handled.
 */
const arrowKeyHandler = (direction: "up" | "down" | "left" | "right") => {
  return (
    state: EditorState,
    dispatch?: (tr: Transaction) => void,
    view?: EditorView,
  ): boolean => {
    const { selection } = state;
    const { $from } = selection;
    const userMode = proofFlow.getUserMode();
    const node = $from.node($from.depth);

    // Check if the current node is not a markdown node
    if (node.type.name !== "markdown") {
      return true;
    }

    const inStudentMode = userMode === UserMode.Student;

    const containingNode = getContainingNode(selection);
    const inInput = containingNode?.type.name === "input_content";

    // Check if the user is in student mode and inside an input_content node
    if (inStudentMode && inInput) {
      const block = view!.endOfTextblock(direction);
      const isFirstChild = containingNode?.firstChild === node;
      // If the user is trying to move up or left and is the first child of the containing node, move to the previous block
      if ((direction === "up" || direction === "left") && isFirstChild) {
        return block;
      }
      const isLastChild = containingNode?.lastChild === node;
      // If the user is trying to move down or right and is the last child of the containing node, move to the next block
      if ((direction === "down" || direction === "right") && isLastChild) {
        return block;
      }
    }
    return false;
  };
};

// TODO: Documentation
/**
 * Array of plugins used in the ProofFlow editor.
 * @type {Plugin[]}
 */
export const ProofFlowPlugins: Plugin[] = [
  mathPlugin,
  collapsibleAreaPlugin,
  markdownPlugin,
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
