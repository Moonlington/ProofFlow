import { SettingsOverlay } from "./settings";
import { undo, redo } from "prosemirror-history";
import { proofFlow } from "../../main";
import { EditorView } from "prosemirror-view";

export class SettingsBar {
    private _contentElement: HTMLElement;
    private _settingsOverlay: SettingsOverlay;
    private _editorView: EditorView;

    constructor(contentElement: HTMLElement, settingsOverlay: SettingsOverlay, editorView: EditorView) {
        this._contentElement = contentElement;
        this._settingsOverlay = settingsOverlay;
        this._editorView = editorView;
        this.render();
    }

    private render() {
        const settingsBar = document.createElement('div');
        settingsBar.classList.add('settings-bar');

        const commands = [
            { symbol: "&#9881;", cmd: () => this._settingsOverlay.showOverlay(true), hoverText: 'Show Settings Menu' },
            { symbol: "&#x21bb;", cmd: () => proofFlow.reset(), hoverText: 'Clear File' },
            { symbol: "&#x1F5AB;", cmd: () => proofFlow.saveFile(), hoverText: 'Save File' },
            { symbol: "&#x1f5c1;", cmd: () => NaN, hoverText: 'Open File' },
            { symbol: "&#8617;", cmd: () => undo(this._editorView.state, this._editorView.dispatch), hoverText: 'Undo Last Action(ctr-z)' },
            { symbol: "&#8618;", cmd: () => redo(this._editorView.state, this._editorView.dispatch), hoverText: 'Redo Last Action(ctr-y)' },
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
            const input = document.createElement('input');
            input.type="file" 
            input.id="file-input"
            input.style.display="none"
            button = document.createElement('label');
            button.innerHTML = symbol;
            button.htmlFor="file-input" 
            button.style.paddingTop = '1.5px';
        }
        else {
            button = document.createElement('button');
            button.innerHTML = symbol;
            button.onclick = () => cmd();
            if (symbol === "&#8617;" || symbol === "&#8618;" || symbol === "&#x21bb;") {
                button.style.paddingTop = '2.5px';
            }
        }

        button.title = hoverText;
        button.classList.add('settings-button');

        return button;
    }
}
