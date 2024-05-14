import { Schema } from "prosemirror-model";
import {
  cmdInsertCode,
  cmdInsertMarkdown,
  cmdInsertMath,
} from "./commands/commands";
import { InsertionPlace } from "./commands/helpers";
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

    // Buttons to insert different types of content
    const commands = [
      { name: "Markdown", cmd: cmdInsertMarkdown, bgColor: "#ff000019" },
      { name: "Code", cmd: cmdInsertCode, bgColor: "#2701ff19" },
      { name: "Math", cmd: cmdInsertMath, bgColor: "#f6ff0019" },
    ];

    const columnCount = commands.length + 1; // +1 for the delete button
    const columnWidth = 100 / columnCount;
    
    // Create a column for each button
    for (let i = 0; i < columnCount; i++) {
      const column = document.createElement("div");
      column.className = "button-column";
      column.style.width = `${columnWidth}%`;

      if (i === columnCount - 1) {
        // Last column for the delete button
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", () => {
          deleteSelection(this._editorView.state, this._editorView.dispatch);
        });
        column.appendChild(deleteButton);
      } else {
        // Other columns for the insert buttons
        const buttonGroup = document.createElement("div");
        buttonGroup.className = "button-group";
        const cmd = commands[i].cmd;
        const name = commands[i].name;
        const bgColor = commands[i].bgColor;

        // Insert above button
        const insertAboveButton = this.createButton(cmd, name, InsertionPlace.Above, bgColor);
        buttonGroup.appendChild(insertAboveButton);

        // Insert underneath button
        const insertUnderButton = this.createButton(cmd, name, InsertionPlace.Underneath, bgColor);
        buttonGroup.appendChild(insertUnderButton);

        // Append the button group to the column
        column.appendChild(buttonGroup);
      }

      // Append the column to the button bar
      bar.appendChild(column);
    }

    // Append the button bar to the parent element
    parentElement.insertBefore(bar, parentElement.firstChild);
  }


  /**
   * Creates a button element with the specified properties and event listener.
   * 
   * @param cmd - The function to be executed when the button is clicked.
   * @param name - The name of the button.
   * @param place - The insertion place for the button.
   * @param bgColor - The background color of the button.
   * @returns The created button element.
   */
  createButton(cmd: Function, name: string, place: InsertionPlace, bgColor: string) {
    const button = document.createElement("button");
    button.textContent = `${name} ${place === InsertionPlace.Above ? "Above" : "Below"}`;
    button.style.backgroundColor = bgColor;

    // Event listener to execute the command when the button is clicked
    button.addEventListener("click", () => {
      cmd(this._schema, place)(this._editorView.state, this._editorView.dispatch);
    });

    return button;
  }
}
