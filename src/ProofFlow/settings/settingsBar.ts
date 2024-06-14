import { SettingsOverlay } from "./settings";
import { undo, redo } from "prosemirror-history";
import { proofFlow } from "../../main";
import { EditorView } from "prosemirror-view";

export class SettingsBar {
  private _contentElement: HTMLElement;
  private _settingsOverlay: SettingsOverlay;
  private _editorView: EditorView;

  constructor(
    contentElement: HTMLElement,
    settingsOverlay: SettingsOverlay,
    editorView: EditorView,
  ) {
    this._contentElement = contentElement;
    this._settingsOverlay = settingsOverlay;
    this._editorView = editorView;
    this.render();
  }

  private render() {
    const settingsBar = document.createElement("div");
    settingsBar.classList.add("settings-bar");

    const commands = [
      {
        symbol: "&#9881;",
        cmd: () => this._settingsOverlay.showOverlay(true),
        hoverText: "Show Settings Menu",
      },
      {
        symbol: "&#x21bb;",
        cmd: () => proofFlow.reset(),
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

    this._contentElement.appendChild(settingsBar);
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
}
