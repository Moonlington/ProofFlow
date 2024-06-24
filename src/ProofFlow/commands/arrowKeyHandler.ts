import { EditorState, Transaction } from "prosemirror-state";
import { proofFlow } from "../../main.ts";
import { UserMode } from "../UserMode/userMode.ts";
import { EditorView } from "prosemirror-view";
import { getContainingNode } from "./helpers.ts";

// Arrow key handler with type definitions
/**
 * Handles arrow key events in the editor.
 * @param direction - The direction of the arrow key ("up", "down", "left", or "right").
 * @returns A function that takes the editor state, dispatch function, and view, and returns a boolean indicating whether the arrow key event was handled.
 */
export const arrowKeyHandler = (
  direction: "up" | "down" | "left" | "right",
) => {
  return (
    state: EditorState,
    _dispatch?: (tr: Transaction) => void,
    view?: EditorView,
  ): boolean => {
    const { selection } = state;
    const { $from } = selection;
    const userMode = proofFlow.getUserMode();
    const node = $from.node($from.depth);
    const inStudentMode = userMode === UserMode.Student;

    // Check if the current node is not a markdown node
    if (node.type.name !== "markdown" && inStudentMode) {
      console.log("here");
      return true;
    }

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
