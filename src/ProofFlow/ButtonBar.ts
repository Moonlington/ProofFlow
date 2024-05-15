import { Schema } from "prosemirror-model";
import {
  cmdInsertCode,
  cmdInsertMarkdown,
  cmdInsertMath,
} from "./Commands/commands";
import { InsertionPlace } from "./Commands/helpers";
import { EditorView } from "prosemirror-view";
import { Node } from "prosemirror-model";
import { deleteSelection } from "prosemirror-commands";

export class ButtonBar {
  private _schema: Schema;
  private _editorView: EditorView;

  /**
   * Represents a ButtonBar component.
   */
  constructor(schema: Schema, editorView: EditorView) {
    this._schema = schema;
    this._editorView = editorView;
  }

  /**
   * Renders the button bar and attaches it to the specified parent element.
   * @param parentElement - The parent element to attach the button bar to.
   */
  render(parentElement: HTMLElement) {
    const bar = document.createElement("div");
    bar.className = "button-bar";

    /**
     * Array of button Commands.
     * Each command object contains a name and a command function.
     */
    const buttonCommands = [
      {
        name: "Markdown",
        command: cmdInsertMarkdown(this._schema, InsertionPlace.Underneath),
      },
      {
        name: "Code",
        command: cmdInsertCode(this._schema, InsertionPlace.Underneath),
      },
      {
        name: "Math",
        command: cmdInsertMath(this._schema, InsertionPlace.Underneath),
      },
      { name: "Delete", command: deleteSelection },
    ];

    // Create a button for each command
    buttonCommands.forEach(({ name, command }) => {
      const button = document.createElement("button");
      button.textContent = name;
      button.addEventListener("click", () => {
        const cell = this.getCurrentCell();
        if (cell) {
          command(this._editorView.state, this._editorView.dispatch);
        }
      });
      bar.appendChild(button);
    });

    parentElement.insertBefore(bar, parentElement.firstChild);
  }

  /**
   * Retrieves the current cell based on the editor's selection.
   * If the selection is empty, it returns the last child node of the document.
   * If there's a selection, it finds the selected node.
   * If no valid cell is found, it creates a new one at the end of the document.
   * @returns The current cell node.
   */
  private getCurrentCell(): Node {
    const { $from, empty } = this._editorView.state.selection;

    // If the selection is empty, return the last child node of the document
    if (empty) {
      const lastChild = this._editorView.state.doc.lastChild;
      if (lastChild && lastChild.isTextblock) {
        return lastChild;
      } else {
        // Create a new node at the end of the document
        const nodeType = this._schema.nodes["codecell"]; // Change to the appropriate node type
        return nodeType.create();
      }
    }

    // If there's a selection, find the selected node
    for (let depth = $from.depth; depth > 0; depth--) {
      const node = $from.node(depth);
      if (
        node.type.name === "codecell" ||
        node.type.name === "markdown" ||
        node.type.name === "math_display"
      ) {
        return node;
      }
    }

    // If no valid cell is found, create a new one at the end of the document
    const nodeType = this._schema.nodes["codecell"]; // Change to the appropriate node type
    return nodeType.create();
  }
}
