import { NodeType, Schema } from "prosemirror-model";
import {
  cmdInsertCode,
  cmdInsertMarkdown,
  cmdInsertMath,
} from "./commands/commands";
import { InsertionPlace } from "./commands/helpers";
import { EditorView } from "prosemirror-view";
import { NodeSelection, Selection } from "prosemirror-state";
import { Node } from "prosemirror-model";
import { deleteSelection } from "prosemirror-commands";
import { undo, redo } from "prosemirror-history";

/**
 * Represents a button bar for interacting with an editor.
 */
export class ButtonBar {
  private _schema: Schema;
  private _editorView: EditorView;

  /**
   * Creates an instance of ButtonBar.
   * @param {Schema} schema - The schema used by the editor.
   * @param {EditorView} editorView - The EditorView instance.
   */
  constructor(schema: Schema, editorView: EditorView) {
    this._schema = schema;
    this._editorView = editorView;
  }

  /**
   * Renders the button bar within a parent HTML element.
   * @param {HTMLElement} parentElement - The parent HTML element to which the button bar will be appended.
   */
  render(parentElement: HTMLElement) {
    const bar = document.createElement("div");
    bar.className = "button-bar";

    const commands = [
      { name: "Markdown", cmd: cmdInsertMarkdown, bgColor: "#ff000019" },
      { name: "Code", cmd: cmdInsertCode, bgColor: "#2701ff19" },
      { name: "Math", cmd: cmdInsertMath, bgColor: "#f6ff0019" },
    ];

    const columnCount = commands.length + 2;
    const columnWidth = 100 / columnCount;

    for (let i = 0; i < columnCount; i++) {
      const column = document.createElement("div");
      column.className = "button-column";
      column.style.width = `${columnWidth}%`;

      if (i === columnCount - 1) {
        // Add delete button
        this.addButton(column, "Delete", () => {
          if (this._editorView.state.selection instanceof NodeSelection) {
            // this works for math nodes
            deleteSelection(this._editorView.state, this._editorView.dispatch)
          } else {
            // this works for markdown and code blocks
            const depth = this._editorView.state.selection.$head.depth;
            const tr = this._editorView.state.tr;
            this._editorView.dispatch(tr.delete(this._editorView.state.selection.$head.before(depth), this._editorView.state.selection.$head.after(depth)));
          }
      });
      } else if (i === columnCount - 2) {
        // Add undo and redo buttons
        this.addButton(column, "Undo", () =>
          undo(this._editorView.state, this._editorView.dispatch),
        );
        this.addButton(column, "Redo", () =>
          redo(this._editorView.state, this._editorView.dispatch),
        );
      } else {
        // Add buttons for specific commands
        const { cmd, name, bgColor } = commands[i];
        this.addButtonGroup(column, cmd, name, bgColor);
      }

      bar.appendChild(column);
    }

    parentElement.insertBefore(bar, parentElement.firstChild);
  }

  /**
   * Adds a button to a column.
   * @param {HTMLElement} column - The column element to which the button will be added.
   * @param {string} label - The label/text of the button.
   * @param {() => void} callback - The callback function to execute when the button is clicked.
   */
  addButton(column: HTMLElement, label: string, callback: () => void) {
    const button = document.createElement("button");
    button.textContent = label;
    button.addEventListener("click", callback);
    column.appendChild(button);
  }

  /**
   * Adds a group of buttons for a specific command.
   * @param {HTMLElement} column - The column element to which the button group will be added.
   * @param {Function} cmd - The command function to execute when a button in the group is clicked.
   * @param {string} name - The name/label of the command.
   * @param {string} bgColor - The background color of the buttons in the group.
   */
  addButtonGroup(
    column: HTMLElement,
    cmd: Function,
    name: string,
    bgColor: string,
  ) {
    const buttonGroup = document.createElement("div");
    buttonGroup.className = "button-group";

    ["Above", "Below"].forEach((place) => {
      const text = name + " " + place;
      const button = this.createButton(
        cmd,
        text,
        getInsertionPlace(place),
        bgColor,
      );
      buttonGroup.appendChild(button);
    });

    column.appendChild(buttonGroup);
  }

  /**
   * Creates a button element.
   * @param {Function} cmd - The command function to execute when the button is clicked.
   * @param {string} text - The text/label of the button.
   * @param {InsertionPlace} place - The insertion place for the command.
   * @param {string} bgColor - The background color of the button.
   * @returns {HTMLButtonElement} The created button element.
   */
  createButton(
    cmd: Function,
    text: string,
    place: InsertionPlace,
    bgColor: string,
  ) {
    const button = document.createElement("button");
    button.textContent = text;
    button.style.backgroundColor = bgColor;
    button.addEventListener("click", () =>
      cmd(this._schema, place)(
        this._editorView.state,
        this._editorView.dispatch,
      ),
    );
    return button;
  }
}

/**
 * Gets the insertion place based on a string value.
 * @param {string} place - The string representation of the insertion place ("Above" or "Below").
 * @returns {InsertionPlace} The corresponding insertion place enum value.
 */
function getInsertionPlace(place: string): InsertionPlace {
  switch (place.toLowerCase()) {
    case "above":
      return InsertionPlace.Above;
    case "below":
      return InsertionPlace.Underneath;
    default:
      throw new Error(`Invalid insertion place: ${place}`);
  }
}
