import { Command, EditorView as CMView, keymap } from "@codemirror/view";
import { EditorView } from "prosemirror-view";
import { exitCode } from "prosemirror-commands";

// File to keep the helper functions for codemirror
// Allows to keep codemirrorviews to be modular and maintainabl

/**
 * Returns the keymap for handling the Tab key in CodeMirror.
 *
 * @param cm The CodeMirror instance.
 * @returns The keymap object.
 */
export function getTabKeyMap(cm: CMView) {
  return keymap.of([
    {
      key: "Tab",
      run: () => {
        const state = cm.state;
        // If there is a selection, replace it with a tab
        cm.dispatch(state.update(state.replaceSelection("\t")));
        return true;
      },
      // Prevent the default behavior of the Tab key
      preventDefault: true,
    },
  ]);
}

/**
 * Returns a keymap containing various key bindings for the editor.
 *
 * @param outerView The outer editor view.
 * @returns The keymap with the specified key bindings.
 */
export function getOtherKeyMaps(outerView: EditorView) {
  return keymap.of([
    // Key bindings for using the arrow keys to navigate the CodeMirror editor
    {
      key: "ArrowUp",
      run: mayBeEscape("line", -1),
    },
    {
      key: "ArrowLeft",
      run: mayBeEscape("char", -1),
    },
    {
      key: "ArrowDown",
      run: mayBeEscape("line", 1),
    },
    {
      key: "ArrowRight",
      run: mayBeEscape("char", 1),
    },
    {
      key: "Ctrl-Enter",
      // Exit the code block and move the cursor to the ProseMirror editor
      // If the cursor is already in the ProseMirror editor, do nothing
      run: () => {
        if (exitCode(outerView.state, outerView.dispatch)) {
          outerView.focus();
          return true;
        }
        return false;
      },
    },
    {
      key: "Ctrl-Shift-m", // Stop linter from calling next diagnostics
      run: () => {
        return true;
      },
    },
  ]);
}

/**
 * Checks if the cursor position can be escaped in the specified direction.
 *
 * @param unit - The unit of movement ("char" or "line").
 * @param dir - The direction of movement (-1 for left/up, 1 for right/down).
 * @returns A command function that checks if the cursor position can be escaped.
 */
export function mayBeEscape(unit: "char" | "line", dir: -1 | 1): Command {
  return (view) => {
    const { state } = view;
    const { selection } = state;

    // Function to convert the offset to a position
    const offsetToPos = () => {
      const offset = selection.main.from;
      const line = state.doc.lineAt(offset);
      return { line: line.number, ch: offset - line.from };
    };

    const pos = offsetToPos();
    const hasSelection = state.selection.ranges.some((r) => !r.empty);

    const firstLine = 1;
    const lastLine = state.doc.lineAt(state.doc.length).number;

    // If we are at the start or end of the cell
    // or there is a selection, we can move
    // Else we cannot move
    if (
      hasSelection ||
      pos.line !== (dir < 0 ? firstLine : lastLine) ||
      (unit === "char" &&
        pos.ch !== (dir < 0 ? 0 : state.doc.line(pos.line).length))
    ) {
      return false;
    }

    return true;
  };
}
