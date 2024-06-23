import { Schema, Node } from "prosemirror-model";
import { CodeMirrorView } from "../codemirror/codemirrorview.ts";
import type { GetPos } from "../codemirror/types.ts";
import { ProofFlowSchema, ProofStatus } from "./proofFlowSchema.ts";
import {
  EditorState,
  EditorStateConfig,
  Transaction,
  Selection,
  NodeSelection,
} from "prosemirror-state";
import { DirectEditorProps, EditorView } from "prosemirror-view";
import { ProofFlowPlugins } from "./plugins.ts";
import { mathSerializer } from "@benrbray/prosemirror-math";
// import { AreaType } from "../parser/area.ts";
import { ButtonBar } from "./ButtonBar.ts";
import { linter } from "@codemirror/lint";

import { applyGlobalKeyBindings } from "../commands/shortcuts";
// import { Area } from "../parser/area.ts";
import { UserMode, handleUserModeSwitch } from "../UserMode/userMode.ts";
import { AcceptedFileType } from "../parser/accepted-file-types.ts";
import { Minimap } from "../minimap.ts";
import {
  Area,
  AreaType,
  CollapsibleArea,
  InputArea,
  OutputConfig,
  ProofFlowDocument,
  docToPFDocument,
} from "./ProofFlowDocument.ts";

import { Parser, SimpleParser } from "../parser/parser.ts";
import {
  CoqMDParser,
  CoqParser,
  LeanParser,
  PureLeanParser,
} from "../parser/parsers.ts";
import {
  CoqMDOutput,
  CoqOutput,
  LeanOutput,
  PureLeanOutput,
} from "../parser/outputconfigs.ts";
import { LSPClientHandler } from "../lspClient/lspClientHandler.ts";
import { DiagnosticsMessageData } from "../lspClient/models.ts";
import { ProofFlowLSPClientFileType } from "../lspClient/ProofFlowLSPClient.ts";
import { reloadColorScheme } from "../settings/updateColors.ts";
import { markdownToRendered } from "../commands/helpers.ts";
import { basicSetupNoHistory } from "../codemirror/basicSetupNoHistory.ts";
import { inputProof } from "../commands/helpers.ts";
import { ProofFlowSaver } from "../fileHandlers/proofFlowSaver.ts";
import { adjustLeftDivWidth } from "../../main.ts";
import { LSPClientManager } from "../lspClient/lspClientManager.ts";
// CSS

export type ProofFlowOptions = {
  editorElem: HTMLElement;
  containerElem: HTMLElement;

  fileSaver?: ProofFlowSaver;
  lspManager?: LSPClientManager;
};

export class ProofFlow {
  private _editorElem: HTMLElement; // The HTML element that serves as the editor container
  private _containerElem: HTMLElement; // The HTML element that contains the initial content for the editor
  private _schema: Schema = ProofFlowSchema; // The schema for the editor
  private editorStateConfig: EditorStateConfig = {
    schema: ProofFlowSchema,
    plugins: ProofFlowPlugins,
  };

  private editorView: EditorView; // The view of the editor

  private fileSaver?: ProofFlowSaver;

  private userMode: UserMode = UserMode.Student; // The teacher mode of the editor
  public fileName: string = "file.mv";

  // static filePath: string = "file.text";
  private fileType: AcceptedFileType = AcceptedFileType.Unknown;

  private minimap: Minimap | null = null;

  private removeGlobalKeyBindings: () => void;

  private _pfDocument: ProofFlowDocument = new ProofFlowDocument(
    this.fileName,
    [],
  );

  private outputConfig?: OutputConfig;

  private lastUpdate?: number;
  private lastTransaction?: number;

  private updateTimeoutID?: NodeJS.Timeout;
  private msTypingBuffer = 250;

  private msMaxUpdateTime = 1000;

  private lspClient?: LSPClientHandler;
  private lspManager?: LSPClientManager;

  /**
   * Represents the ProofFlow class.
   * @constructor
   * @param {HTMLElement} editorElem - The HTML element that serves as the editor container.
   * @param {HTMLElement} containerElem - The HTML element that contains the initial content for the editor.
   */
  constructor(options: ProofFlowOptions) {
    this._editorElem = options.editorElem; // Set the editor element
    this._containerElem = options.containerElem; // Set the container element
    this.fileSaver = options.fileSaver;
    this.lspManager = options.lspManager;

    // Create the editor
    this.editorView = this.createEditorView();

    window.addEventListener("beforeunload", (_) => {
      this.lspClient?.shutdown();
    });
    // Apply global key bindings
    this.removeGlobalKeyBindings = applyGlobalKeyBindings(this.editorView);
  }

  /**
   * Creates an instance of the EditorView.
   * @returns {EditorView} The created EditorView instance.
   */
  private createEditorView(): EditorView {
    // Create the editor state
    const editorState = EditorState.create(this.editorStateConfig);
    let directEditorProps: DirectEditorProps = {
      state: editorState,
      clipboardTextSerializer: (slice) => {
        return mathSerializer.serializeSlice(slice);
      },
      dispatchTransaction: (tr: Transaction) => {
        this.editorView.updateState(this.editorView.state.apply(tr));
        if (tr.docChanged) {
          this.updateWithBuffer(tr.doc);
          this.lastTransaction = Date.now();
        }
      },

      // Define a node view for the custom code mirror node as a prop
      nodeViews: {
        code_mirror: (node: Node, view: EditorView, getPos: GetPos) =>
          new CodeMirrorView(this, {
            node,
            view,
            getPos,
            cmOptions: {
              extensions: [
                // will be changed, and later code from basic setup will be added to the codebase
                basicSetupNoHistory,
                linter(null),
                // javascript(),
                // autocomplete(this),
                // wordHover(this),
              ],
            },
          }),
      },
      attributes: {
        id: "ProofFlowEditor",
      },
    };

    let editorView = new EditorView(this._editorElem, directEditorProps);

    // Synchronize ProseMirror selection changes with codemirror
    editorView.dom.addEventListener("focus", () => {
      this.syncProseMirrorToCodeMirror();
    });

    this.minimap = new Minimap();

    // Create the button bar and render it
    const buttonBar = new ButtonBar(this._schema, editorView);
    buttonBar.render(this._containerElem);

    return editorView;
  }

  updateWithBuffer(doc: Node) {
    let now = Date.now();
    if (!this.lastUpdate) this.lastUpdate = now;
    if (!this.lastTransaction) this.lastTransaction = now;

    if (now - this.lastUpdate > this.msMaxUpdateTime) {
      if (!this.updateTimeoutID) {
        this.updateTimeoutID = setTimeout(
          () => this.updateProofFlowDocument(doc),
          this.msMaxUpdateTime,
        );
      }
      return;
    }

    if (now - this.lastTransaction <= this.msTypingBuffer) {
      clearTimeout(this.updateTimeoutID);
      this.updateTimeoutID = setTimeout(
        () => this.updateProofFlowDocument(doc),
        this.msMaxUpdateTime,
      );
      return;
    }
  }

  updateProofFlowDocument(doc: Node) {
    clearTimeout(this.updateTimeoutID);
    let parsed = docToPFDocument(this.fileName, doc);
    if (this.outputConfig) parsed.outputConfig = this.outputConfig;
    this.lastUpdate = undefined;
    this.lastTransaction = undefined;
    this.updateTimeoutID = undefined;
    if (parsed.toString() === this._pfDocument.toString()) return;
    this._pfDocument = parsed;

    this.lspClient?.didChange(parsed);
  }

  getLSPClient(): LSPClientHandler | undefined {
    return this.lspClient;
  }

  /**
   * Synchronizes the ProseMirror selection with the CodeMirror selection.
   * Helps with navigating from code mirror to other node types
   */
  syncProseMirrorToCodeMirror() {
    const { state } = this.editorView;
    const { selection } = state;

    // Check if the current selection is within a code_mirror node
    if (
      selection.empty &&
      selection.$anchor.parent.type.name === "code_mirror"
    ) {
      const pos = selection.$anchor.before(selection.$anchor.depth);
      const currentCodeMirror = CodeMirrorView.findByPos(pos);

      // Check for not null (TypeScript mandates)
      if (currentCodeMirror) {
        currentCodeMirror.blurInstance();
      }
    }
  }

  public get pfDocument(): ProofFlowDocument {
    this.updateProofFlowDocument(this.editorView.state.doc);
    return this._pfDocument;
  }

  public findNode(
    predicate: (node: Node, pos: number) => boolean,
  ): [Node, number] | undefined {
    let found: [Node, number] | undefined;
    this.editorView.state.doc.descendants((node, pos) => {
      if (predicate(node, pos)) found = [node, pos];
      if (found) return false;
    });
    return found;
  }

  public handleDiagnostics(message: DiagnosticsMessageData) {
    CodeMirrorView.resetDiagnostics();
    for (let diag of message.diagnostics) {
      let res = this._pfDocument.getAreayByPosition(diag.range.start);
      if (!res) continue;

      let [area, start] = res;
      let end = area.getOffset(diag.range.end);
      let found = this.findNode((node, _) => node.attrs.id === area.id);
      if (!found) continue;
      let codemirror = CodeMirrorView.findByPos(found[1]);
      if (!codemirror) continue;

      if (end == undefined) {
        // This should not happen
        console.error("End is mapped to undefined in handleDiagnostics");
        continue;
      }

      codemirror.handleDiagnostic(diag, start, end);
    }
    this.setProofColors();
  }

  private setProofColors() {
    // Previous input area node and its offset
    let prevInput: Node | null = null;
    let prevOffset: number;
    let focusedInstance: any;

    // Iterate over all nodes in doc
    this.getState().doc.descendants((node: Node, offset: number) => {
      if (node.type.name != "code_mirror" && node.type.name != "input")
        return true;

      if (node.type.name == "input") {
        // Save the node and offset
        prevInput = node;
        prevOffset = offset;

        // Count the amount of diagnostics inside the input area
        let diagnosticCount = 0;
        node.descendants((node: Node, childOffset: number) => {
          if (node.type.name != "code_mirror") return true;
          let instance = CodeMirrorView.findByPos(offset + childOffset + 1);
          if (instance?.cm.hasFocus) {
            focusedInstance = instance;
          }
          if (instance == null) return false;
          if (instance.isError) diagnosticCount++;
        });

        // If it is zero then set it to correct otherwise incorrect
        if (diagnosticCount == 0) {
          inputProof(node, ProofStatus.Correct, offset);
        } else {
          inputProof(node, ProofStatus.Incorrect, offset);
        }
        return false;
      }

      // If instance has QED error then set previous input to incorrect
      let instance = CodeMirrorView.findByPos(offset);
      if (instance == null) return true;
      if (instance.isQEDError && prevInput != null) {
        inputProof(prevInput, ProofStatus.Incorrect, prevOffset);
      }
    });
    if (focusedInstance != null) {
      focusedInstance.forceforwardSelection();
    }
  }

  /**
   * Opens a file and creates text or code areas based on the parsed content.
   *
   * @param text - The content of the Coq file.
   * @param fileType - The type of the file.
   */
  public async openFile(text: string, fileType: AcceptedFileType) {
    this.fileType = fileType;
    text = text.replace(/\r/gi, ""); // Windows uses Carriage feeds but we don't like that.

    // Process the file content
    let parser: Parser;
    let lspClientFileType: ProofFlowLSPClientFileType;
    switch (this.fileType) {
      case AcceptedFileType.Coq:
        window.localStorage.setItem("currentLspType", "Coq");
        parser = CoqParser;
        this.outputConfig = CoqOutput;
        let proxy = parser as SimpleParser;
        proxy.defaultAreaType = AreaType.Code;
        lspClientFileType = ProofFlowLSPClientFileType.Coq;
        break;
      case AcceptedFileType.CoqMD:
        parser = CoqMDParser;
        this.outputConfig = CoqMDOutput;
        lspClientFileType = ProofFlowLSPClientFileType.Coq;
        break;
      case AcceptedFileType.Lean:
        if (text.indexOf("import VersoProofFlow") !== -1) {
          parser = LeanParser;
          this.outputConfig = LeanOutput;
        } else {
          parser = PureLeanParser;
          this.outputConfig = PureLeanOutput;
          let proxy = parser as SimpleParser;
          proxy.defaultAreaType = AreaType.Code;
        }
        lspClientFileType = ProofFlowLSPClientFileType.Lean;
        break;
      default:
        return;
    }
    let pfDocument = parser.parse(text);
    pfDocument.uri = this.fileName;
    this.setProofFlowDocument(pfDocument);

    this.lspClient = this.lspManager?.getLSP(lspClientFileType);
    if (!this.lspClient) {
      console.log("No lsp found");
      return;
    }
    this.lspClient.setDiagnosticsHandler(this.handleDiagnostics.bind(this));
    await this.lspClient.initialize();
    this.lspClient.initialized();
    this.lspClient.didOpen(pfDocument);
  }

  public setProofFlowDocument(pfDocument: ProofFlowDocument) {
    this._pfDocument = pfDocument;
    if (this.outputConfig) this._pfDocument.outputConfig = this.outputConfig;
    console.log("PF DOCUMENT IS BEING SET");
    console.log(pfDocument);
    for (let area of this._pfDocument.areas) {
      switch (area.type) {
        case AreaType.Text:
          this.createTextArea(area, true);
          break;
        case AreaType.Code:
          this.createCodeArea(area);
          break;
        case AreaType.Math:
          this.createMathArea(area);
          break;
        case AreaType.Collapsible:
          this.createCollapsible(area as CollapsibleArea);
          break;
        case AreaType.Input:
          this.createInput(area as InputArea);
          break;
      }
    }
  }

  /**
   * Retrieves the current state of the editor.
   * @returns The current EditorState.
   */
  public getState(): EditorState {
    return this.editorView.state;
  }

  /**
   * Inserts a node at the end of the document.
   *
   * @param node - The node to be inserted.
   */
  private insertAtEnd(node: Node) {
    // Create a new transaction and get the counter
    let trans: Transaction = this.getState().tr;
    let counter = this.getState().doc.content.size;

    // Insert the node at the end of the document and update the editor state
    trans = trans.setSelection(Selection.atEnd(this.getState().doc));
    trans = trans.insert(counter, node);
    this.editorView.state = this.editorView.state.apply(trans);
    this.editorView.updateState(this.editorView.state);
  }

  /**
   * Creates a input element based on the provided wrapper.
   *
   * @param wrapper - The wrapper containing information for the input element.
   */
  public createInput(area: InputArea) {
    let contentNodes: Node[] = [];
    area.subAreas.forEach((innerArea) => {
      let node: Node;
      switch (innerArea.type) {
        case AreaType.Text:
          node = this.createTextNode(innerArea, true);
          break;
        case AreaType.Code:
          node = this.createCodeNode(innerArea);
          break;
        case AreaType.Math:
          node = this.createMathNode(innerArea);
          break;
        default:
          return;
      }
      contentNodes.push(node);
    });
    let inputContentNode: Node = this._schema.node(
      "input_content",
      { id: area.id },
      contentNodes,
    );
    let inputNode: Node = this._schema.node("input", { id: area.id }, [
      inputContentNode,
    ]);
    this.insertAtEnd(inputNode);
  }

  /**
   * Creates a collapsible element based on the provided wrapper.
   *
   * @param wrapper - The wrapper containing information for the collapsible element.
   */
  public createCollapsible(area: CollapsibleArea) {
    // Create the title node
    const title = area.content;
    let textNode: Node = this._schema.node(
      "collapsible_title",
      null,
      title ? ProofFlowSchema.text(title) : undefined,
    );

    // Create the content nodes
    let contentNodes: Node[] = [];
    area.subAreas.forEach((innerArea) => {
      let node: Node;
      switch (innerArea.type) {
        case AreaType.Text:
          node = this.createTextNode(innerArea, true);
          break;
        case AreaType.Code:
          node = this.createCodeNode(innerArea);
          break;
        case AreaType.Math:
          node = this.createMathNode(innerArea);
          break;
        default:
          return;
      }
      contentNodes.push(node);
    });

    // Create the content node
    let contentNode: Node = this._schema.node(
      "collapsible_content",
      { visible: false },
      contentNodes,
    );

    // Create the collapsible node
    let collapsibleNode: Node = this._schema.node(
      "collapsible",
      { id: area.id },
      [textNode, contentNode],
    );

    // Insert the collapsible node at the end of the editor
    this.insertAtEnd(collapsibleNode);
  }

  /**
   * Creates a text node with the specified text.
   *
   * @param text - The text content of the node.
   * @returns The created text node.
   */
  private createTextNode(area: Area, render: boolean): Node {
    let textNode: Node = this._schema.node(
      "markdown",
      { id: area.id },
      area.content ? ProofFlowSchema.text(area.content) : undefined,
    );
    return render ? markdownToRendered(textNode, this._schema) : textNode;
  }

  /**
   * Creates a code node with the specified text.
   *
   * @param text - The text to be included in the code node.
   * @returns The created code node.
   */
  private createCodeNode(area: Area): Node {
    let textNode: Node = this._schema.node(
      "code_mirror",
      { id: area.id },
      area.content ? ProofFlowSchema.text(area.content) : undefined,
    );
    return textNode;
  }

  /**
   * Creates a math node with the specified text.
   *
   * @param text - The text to be included in the math node.
   * @returns The created math node.
   */
  private createMathNode(area: Area): Node {
    let textNode: Node = this._schema.node(
      "math_display",
      { id: area.id },
      area.content ? ProofFlowSchema.text(area.content) : undefined,
    );
    return textNode;
  }

  /**
   * Creates a new text area in the editor and inserts the specified text.
   *
   * @param text - The text to be inserted in the text area.
   */
  public createTextArea(area: Area, render: boolean): void {
    let textNode = this.createTextNode(area, render);
    this.insertAtEnd(textNode);
  }

  /**
   * Creates a new code area in the editor and inserts the specified code.
   *
   * @param text - The code to be inserted in the code area.
   */
  public createCodeArea(area: Area): void {
    let codeNode = this.createCodeNode(area);
    this.insertAtEnd(codeNode);
  }

  /**
   * Creates a new math area in the editor and inserts the specified math.
   *
   * @param text - The math to be inserted in the math area.
   */
  public createMathArea(area: Area): void {
    let mathNode = this.createMathNode(area);
    this.insertAtEnd(mathNode);
  }

  /**
   * Sets the file name for the ProofFlow instance.
   *
   * @param fileName - The name of the file.
   */
  public setFileName(fileName: string) {
    this.fileName = fileName;
  }

  /**
   * Saves the file by creating a download link for the content and triggering a click event on it.
   */
  public saveFile() {
    this.fileSaver?.save(this);
  }

  /**
   * Resets the editor by destroying the minimap, removing all children from the editor and content elements,
   * and creating a new editor view.
   */
  public reset() {
    this.lspClient?.didClose(this.pfDocument);
    this.lspClient?.shutdown();
    this.lspClient = undefined;

    this.minimap?.destroy();
    this.removeGlobalKeyBindings();

    CodeMirrorView.resetDiagnostics();
    CodeMirrorView.instances = [];
    CodeMirrorView.focused = null;

    // Remove all children from the editor element
    while (this._editorElem.firstChild != null) {
      this._editorElem.removeChild(this._editorElem.firstChild);
    }

    // remove the buttonBar
    this._containerElem.removeChild(document.getElementById("button-bar")!);

    // Create a new editor view
    this.editorView = this.createEditorView();
    this.removeGlobalKeyBindings = applyGlobalKeyBindings(this.editorView);

    // Ensure that the usermode and color scheme and size are loaded correctly.
    handleUserModeSwitch();
    reloadColorScheme();
    adjustLeftDivWidth();
    const on = localStorage.getItem("minimap") === "true";

    if (!on) {
      this.switchMinimap();
    }
  }

  /**
   * Retrieves the editor view associated with the ProofFlow instance.
   * @returns The editor view.
   */
  public getEditorView(): EditorView {
    return this.editorView;
  }

  /**
   * Gets the current user mode.
   * @returns The user mode.
   */
  public getUserMode(): UserMode {
    return this.userMode;
  }

  /**
   * Switches the user mode between Teacher and Student.
   *
   * @param UserModebutton - The HTML element representing the user mode button.
   */
  public switchUserMode() {
    let newUserMode: UserMode;
    newUserMode =
      this.userMode === UserMode.Teacher ? UserMode.Student : UserMode.Teacher;
    this.userMode = newUserMode;
    window.localStorage.setItem(
      "teacherMode",
      newUserMode === UserMode.Teacher ? "true" : "false",
    );
    handleUserModeSwitch();
  }

  /**
   * Inserts the given string at the selection/cursor position.
   *
   * @param string - The string to insert.
   */
  async insertAtCursor(string: string) {
    // Create a new transaction
    let trans: Transaction = this.getState().tr;
    // This does not work for math nodes
    if (this.editorView.state.selection instanceof NodeSelection) {
      return;
    } else {
      // Insert the text at the selection/cursor-position and update the editor state
      trans = trans.insertText(string);
      this.editorView.state = this.editorView.state.apply(trans);
      this.editorView.updateState(this.editorView.state);
    }
  }

  public switchMinimap() {
    this.minimap?.switch();
  }
}
