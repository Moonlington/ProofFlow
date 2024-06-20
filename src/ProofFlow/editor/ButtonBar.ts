import { Schema } from "prosemirror-model";
import {
  cmdInsertCode,
  cmdInsertMarkdown,
  cmdInsertMath,
} from "../commands/commands.ts";
import {
  InsertionPlace,
  getContainingNode,
  toggleLineNumbers,
} from "../commands/helpers.ts";
import { EditorView } from "prosemirror-view";
import { NodeSelection } from "prosemirror-state";
import { deleteSelection, selectParentNode } from "prosemirror-commands";
import {
  getCollapsibleInsertCommand,
  getInputInsertCommand,
} from "../commands/insert-commands.ts";
import { proofFlow, readSingleFile } from "../../main.ts";
import { UserMode } from "../UserMode/userMode.ts";
import { undo, redo } from "prosemirror-history";
import { showOverlay } from "../../main.ts";

/**
 * Represents a button bar for interacting with an editor.
 */
export class ButtonBar {
  private _schema: Schema;
  private _editorView: EditorView;
  public _bar: HTMLElement;
  private _cellBar: HTMLElement;

  /**
   * Creates an instance of ButtonBar.
   * @param {Schema} schema - The schema used by the editor.
   * @param {EditorView} editorView - The EditorView instance.
   */
  constructor(schema: Schema, editorView: EditorView) {
    this._schema = schema;
    this._editorView = editorView;
    this._bar = document.createElement("div");
    this._cellBar = document.createElement("div");
  }

  /**
   * Renders the button bar within a parent HTML element.
   * @param {HTMLElement} parentElement - The parent HTML element to which the button bar will be appended.
   */
  render(parentElement: HTMLElement) {
    this._bar.className = "button-bar";
    this._bar.id = "button-bar";
    this._cellBar.className = "cell-bar";

    // Remove listener to read file if it exists
    document
      .getElementById("file-input")
      ?.removeEventListener("change", readSingleFile, false);

    this.addCellButtons();
    this.addOtherButtons();
    this.addSettingsButtons();
    this._bar.appendChild(this._cellBar);

    parentElement.insertBefore(this._bar, parentElement.firstChild);

    // Add listener to read file
    document
      .getElementById("file-input")
      ?.addEventListener("change", readSingleFile, false);
  }

  /**
   * Adds cell buttons to the editor.
   * These buttons allow the user to insert different types of cells (Text, Code, Math) above or below the current cell.
   */
  private addCellButtons() {
    const latex = `<svg viewBox="0 0 1200 500" xmlns="http://www.w3.org/2000/svg">
    <path d="m5.46 4.23h-.25c-.1 1.02-.24 2.26-2 2.26h-.81c-.47 0-.49-.07-.49-.4v-5.31c0-.34 0-.48.94-.48h.33v-.3c-.36.03-1.26.03-1.67.03-.39 0-1.17 0-1.51-.03v.3h.23c.77 0 .79.11.79.47v5.25c0 .36-.02.47-.79.47h-.23v.31h5.19z" transform="matrix(45 0 0 45 40 47.65)"/>
    <path d="m2.81.16c-.04-.12-.06-.16-.19-.16s-.16.04-.2.16l-1.61 4.08c-.07.17-.19.48-.81.48v.25h1.55v-.25c-.31 0-.5-.14-.5-.34 0-.05.01-.07.03-.14 0 0 .34-.86.34-.86h1.98l.4 1.02c.02.04.04.09.04.12 0 .2-.38.2-.57.2v.25h1.97v-.25h-.14c-.47 0-.52-.07-.59-.27 0 0-1.7-4.29-1.7-4.29zm-.4.71.89 2.26h-1.78z" transform="matrix(45 0 0 45 151.6 40)"/>
    <path d="m6.27 0h-6.09s-.18 2.24-.18 2.24h.24c.14-1.61.29-1.94 1.8-1.94.18 0 .44 0 .54.02.21.04.21.15.21.38v5.25c0 .34 0 .48-1.05.48h-.4v.31c.41-.03 1.42-.03 1.88-.03s1.49 0 1.9.03v-.31h-.4c-1.05 0-1.05-.14-1.05-.48v-5.25c0-.2 0-.34.18-.38.11-.02.38-.02.57-.02 1.5 0 1.65.33 1.79 1.94h.25s-.19-2.24-.19-2.24z" transform="matrix(45 0 0 45 356.35 50.35)"/>
    <path d="m6.16 4.2h-.25c-.25 1.53-.48 2.26-2.19 2.26h-1.32c-.47 0-.49-.07-.49-.4v-2.66h.89c.97 0 1.08.32 1.08 1.17h.25v-2.64h-.25c0 .85-.11 1.16-1.08 1.16h-.89v-2.39c0-.33.02-.4.49-.4h1.28c1.53 0 1.79.55 1.95 1.94h.25l-.28-2.24h-5.6v.3h.23c.77 0 .79.11.79.47v5.22c0 .36-.02.47-.79.47h-.23v.31h5.74z" transform="matrix(45 0 0 45 602.5 150.25)"/>
    <path d="m3.76 2.95 1.37-2c.21-.32.55-.64 1.44-.65v-.3h-2.38v.3c.4.01.62.23.62.46 0 .1-.02.12-.09.23 0 0-1.14 1.68-1.14 1.68l-1.28-1.92c-.02-.03-.07-.11-.07-.15 0-.12.22-.29.64-.3v-.3c-.34.03-1.07.03-1.45.03-.31 0-.93-.01-1.3-.03v.3h.19c.55 0 .74.07.93.35 0 0 1.83 2.77 1.83 2.77l-1.63 2.41c-.14.2-.44.66-1.44.66v.31h2.38v-.31c-.46-.01-.63-.28-.63-.46 0-.09.03-.13.1-.24l1.41-2.09 1.58 2.38c.02.04.05.08.05.11 0 .12-.22.29-.65.3v.31c.35-.03 1.08-.03 1.45-.03.42 0 .88.01 1.3.03v-.31h-.19c-.52 0-.73-.05-.94-.36 0 0-2.1-3.18-2.1-3.18z" transform="matrix(45 0 0 45 845.95 47.65)"/>
    </svg>`;

    const commands = [
      { name: "Text", cmd: cmdInsertMarkdown, hoverName: "Text" },
      { name: "Code", cmd: cmdInsertCode, hoverName: "Code" },
      { name: latex, cmd: cmdInsertMath, hoverName: "LaTeX" },
    ];

    commands.forEach(({ name, cmd, hoverName }) => {
      const above = name + " ↑";
      const below = name + " ↓";
      this.addButton(
        above,
        () =>
          cmd(this._schema, InsertionPlace.Above)(
            this._editorView.state,
            this._editorView.dispatch,
          ),
        `Insert ${hoverName} cell above the current cell.(Ctrl-Shift-${name === "Text" ? "m" : name === "Code" ? "c" : "b"})`,
      );
      this.addButton(
        below,
        () =>
          cmd(this._schema, InsertionPlace.Underneath)(
            this._editorView.state,
            this._editorView.dispatch,
          ),
        `Insert ${hoverName} cell bellow the current cell.(Ctrl-${name === "Text" ? "m" : name === "Code" ? "c" : "b"})`,
      );
    });
  }

  /**
   * Adds other buttons to the button bar.
   * The buttons include Delete, Parent, and Input.
   * - Delete: Deletes the selected content.
   * - Parent: Selects the parent node.
   * - Input: Inserts an input node.
   */
  private addOtherButtons() {
    const deleteFunction = () => {
      const selection = this._editorView.state.selection;
      const container = getContainingNode(selection);
      if (
        proofFlow.getUserMode() === UserMode.Student &&
        container?.type.name !== "input_content"
      )
        return;
      if (this._editorView.state.selection instanceof NodeSelection) {
        // this works for math nodes
        deleteSelection(this._editorView.state, this._editorView.dispatch);
      } else {
        // this works for markdown and code blocks
        const depth = this._editorView.state.selection.$head.depth;
        const tr = this._editorView.state.tr;
        this._editorView.dispatch(
          tr.delete(
            this._editorView.state.selection.$head.before(depth),
            this._editorView.state.selection.$head.after(depth),
          ),
        );
      }
    };

    const buttons = [
      {
        name: "Delete",
        command: deleteFunction,
        hoverText: "Delete the selected node or content.",
      },
      {
        name: "Line nr",
        command: () => {
          toggleLineNumbers();
        },
        hoverText: "Toggle line numbers", //TODO Add functionality and shortcut
      },
      {
        name: "Parent",
        command: () =>
          selectParentNode(this._editorView.state, this._editorView.dispatch),
        hoverText: "Select the parent node(Ctrl-p)",
      },
      {
        name: "Input",
        command: () => {
          let command = getInputInsertCommand();
          command(this._editorView.state, this._editorView.dispatch);
        },
        hoverText: "Place the current node in an input node(Ctrl-i)",
      },
      {
        name: "Collapse",
        command: () => {
          let command = getCollapsibleInsertCommand();
          command(this._editorView.state, this._editorView.dispatch);
        },
        hoverText: "Place the current node in an colapsible node(Ctrl-b)",
      },
    ];

    buttons.forEach(({ name, command, hoverText }) => {
      this.addButton(name, command, hoverText);
    });
  }

  private addSettingsButtons() {
    const settingsBar = document.createElement("div");
    settingsBar.classList.add("settings-bar");

    const commands = [
      {
        symbol: "&#9881;",
        cmd: () => showOverlay(true),
        hoverText: "Show Settings Menu",
      },
      {
        symbol: "&#x21bb;",
        cmd: () => {
          proofFlow.reset();
          proofFlow.setFileName("file.mv");
        },
        hoverText: "Clear File",
      },
      {
        symbol: "&#x1F5AB;",
        cmd: () => proofFlow.saveFile(),
        hoverText: "Save File",
      },
      { symbol: "&#x1f5c1;", cmd: () => NaN, hoverText: "Open File" },
      {
        symbol: "&#8617;",
        cmd: () => undo(this._editorView.state, this._editorView.dispatch),
        hoverText: "Undo Last Action(Ctrl-z)",
      },
      {
        symbol: "&#8618;",
        cmd: () => redo(this._editorView.state, this._editorView.dispatch),
        hoverText: "Redo Last Action(Ctrl-y)",
      },
    ];

    commands.forEach(({ symbol, cmd, hoverText }) => {
      const button = this.CreateButton(symbol, cmd, hoverText);
      settingsBar.appendChild(button);
    });

    this._bar.appendChild(settingsBar);
  }

  private CreateButton(symbol: string, cmd: () => void, hoverText: string) {
    let button;
    if (symbol === "&#x1f5c1;") {
      button = document.createElement("div");
      const input = document.createElement("input");
      input.type = "file";
      input.id = "file-input";
      input.style.display = "none";

      const label = document.createElement("label");
      label.innerHTML = symbol;
      label.htmlFor = "file-input";
      label.style.paddingTop = "0.5px";
      button.appendChild(input);
      button.appendChild(label);
      label.classList.add("settings-button");
      button.style.border = "none";
    } else {
      button = document.createElement("button");
      button.innerHTML = symbol;
      button.onclick = () => cmd();
      if (
        symbol === "&#8617;" ||
        symbol === "&#8618;" ||
        symbol === "&#x21bb;"
      ) {
        button.style.paddingTop = "2.5px";
      }
      button.classList.add("settings-button");
    }
    button.title = hoverText;

    return button;
  }

  /**
   * Adds a button to the button bar.
   * @param {string} label - The label/text of the button.
   * @param {() => void} callback - The callback function to execute when the button is clicked.
   * @param {string} hoverText - The hover text of the button.
   */
  private addButton(label: string, callback: () => void, hoverText: string) {
    const button = document.createElement("button");
    button.innerHTML = label;
    if (label === "line nr") {
      button.id = "line-nr-button";
    } else {
      button.id = label.toLowerCase() + "-button";
    }
    button.addEventListener("click", callback);
    button.title = hoverText;
    button.classList.add("editor-button");
    this._cellBar.appendChild(button);
  }
}
