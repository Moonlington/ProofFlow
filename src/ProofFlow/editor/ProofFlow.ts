import { Schema, DOMParser, Node } from "prosemirror-model";
import { CodeMirrorView } from "../codemirror/index.ts";
import type { GetPos } from "../codemirror/types.ts";
import { ProofFlowSchema, proof } from "./proofflowschema.ts";
import {
  EditorState,
  EditorStateConfig,
  Transaction,
  Selection,
} from "prosemirror-state";
import { DirectEditorProps, EditorView } from "prosemirror-view";
import { ProofFlowPlugins } from "./plugins.ts";
import { mathSerializer } from "@benrbray/prosemirror-math";
// import { AreaType } from "../parser/area.ts";
import {
  parseToAreasMV,
  parseToAreasV,
  parseToProofFlow,
  parseToAreasLean,
} from "../parser/parse-to-proofflow.ts";
import { ButtonBar } from "./ButtonBar.ts";
import { getContent } from "../outputparser/savefile.ts";

import { basicSetup } from "codemirror";
import { javascript } from "@codemirror/lang-javascript";

import { applyGlobalKeyBindings } from "../commands/shortcuts";
import { Wrapper, WrapperType } from "../parser/wrapper.ts";
// import { Area } from "../parser/area.ts";
import {
  mathblockNodeType,
  codeblockNodeType,
  collapsibleNodeType,
  markdownblockNodeType,
  collapsibleTitleNodeType,
  collapsibleContentType,
  inputNodeType,
  inputContentType,
} from "./nodetypes.ts";
import { UserMode, handleUserModeSwitch } from "../UserMode/userMode.ts";
import { AcceptedFileType } from "../parser/accepted-file-types.ts";
import { Minimap } from "../minimap.ts";
import { inputProof } from "../commands/helpers.ts";
import {
  Area,
  AreaType,
  CollapsibleArea,
  InputArea,
  ProofFlowDocument,
} from "./ProofFlowDocument.ts";

import { Parser, SimpleParser } from "../parser/parser.ts";
// CSS

export class ProofFlow {
  private _editorElem: HTMLElement; // The HTML element that serves as the editor container
  private _contentElem: HTMLElement; // The HTML element that contains the initial content for the editor

  private _schema: Schema = ProofFlowSchema; // The schema for the editor
  private editorStateConfig: EditorStateConfig = {
    schema: ProofFlowSchema,
    plugins: ProofFlowPlugins,
  };

  private editorView: EditorView; // The view of the editor

  private userMode: UserMode = UserMode.Student; // The teacher mode of the editor

  private fileName: string = "file.txt";

  private minimap: Minimap | null = null;

  private removeGlobalKeyBindings: () => void;

  private pfDocument: ProofFlowDocument = new ProofFlowDocument([]);

  /**
   * Represents the ProofFlow class.
   * @constructor
   * @param {HTMLElement} editorElem - The HTML element that serves as the editor container.
   * @param {HTMLElement} contentElem - The HTML element that contains the initial content for the editor.
   */
  constructor(editorElem: HTMLElement, contentElem: HTMLElement) {
    this._editorElem = editorElem; // Set the editor element
    this._contentElem = contentElem; // Set the content element
    // Create the editor
    this.editorView = this.createEditorView();
    // Apply global key bindings
    this.removeGlobalKeyBindings = applyGlobalKeyBindings(
      this.editorView,
      this.minimap!,
    );
  }

  // TODO: Documentation
  private createEditorView(): EditorView {
    // Create the editor state
    const editorState = EditorState.create(this.editorStateConfig);
    let directEditorProps: DirectEditorProps = {
      state: editorState,
      clipboardTextSerializer: (slice) => {
        return mathSerializer.serializeSlice(slice);
      },

      // Define a node view for the custom code mirror node as a prop
      nodeViews: {
        code_mirror: (node: Node, view: EditorView, getPos: GetPos) =>
          new CodeMirrorView({
            node,
            view,
            getPos,
            cmOptions: {
              extensions: [
                // will be changed, and later code from basic setup will be added to the codebase
                basicSetup,
                javascript(),
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
    buttonBar.render(this._editorElem);

    return editorView;
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
        console.log("Moving from codemirror");
        currentCodeMirror.blurInstance();
      }
    }
  }

  /**
   * Opens a file and creates text or code areas based on the parsed content.
   *
   * @param text - The content of the Coq file.
   * @param fileType - The type of the file.
   */
  public openFile(text: string, fileType: AcceptedFileType) {
    // Process the file content
    // let documentParsingFunction: (text: string) => ProofFlowDocument;
    // switch (fileType) {
    //   case AcceptedFileType.Coq:
    //     documentParsingFunction = parseToAreasV;
    //     break;
    //   case AcceptedFileType.CoqMD:
    //     documentParsingFunction = parseToAreasMV;
    //     break;
    //   case AcceptedFileType.Lean:
    //     documentParsingFunction = parseToAreasLean
    //     break;
    //   default:
    //     return;
    // }
    // this.setProofFlowDocument(documentParsingFunction(text))
    let parser: Parser;
    switch (fileType) {
      case AcceptedFileType.Lean:
        parser = new SimpleParser({
          // Text: [":::text\n", ":::\n"],
          Code: [":::code\n", ":::\n"],
          Math: [":::math\n", ":::\n"],
          Collapsible: [":::collapsible\n", ":::\n"],
          Input: [":::input\n", ":::\n"],
        });
        break;
      default:
        return;
    }
    this.setProofFlowDocument(parser.parse(text));
  }

  public setProofFlowDocument(pfDocument: ProofFlowDocument) {
    this.pfDocument = pfDocument;

    for (let area of this.pfDocument.areas) {
      switch (area.type) {
        case AreaType.Text:
          this.createTextArea(area);
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

  // /**
  //  * Renders the wrappers by creating text or code areas based on the parsed content.
  //  *
  //  * @param wrappers - An array of Wrapper objects.
  //  */
  // public renderWrappers(wrappers: Wrapper[]): void {
  //   for (let wrapper of wrappers) {
  //     // Create text or code areas based on the parsed content
  //     if (wrapper.wrapperType == WrapperType.Collapsible) {
  //       this.createCollapsible(wrapper);
  //     } else if (wrapper.wrapperType == WrapperType.Input) {
  //       this.createInput(wrapper);
  //     } else {
  //       for (let area of wrapper.areas) {
  //         if (area.areaType == AreaType.Markdown) {
  //           this.createTextArea(area.text);
  //         } else if (area.areaType == AreaType.Code) {
  //           this.createCodeArea(area.text);
  //         } else if (area.areaType == AreaType.Math) {
  //           this.createMathArea(area.text);
  //         }
  //       }
  //     }
  //   }
  // }

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
          node = this.createTextNode(innerArea);
          break;
        case AreaType.Code:
          node = this.createTextNode(innerArea);
          break;
        case AreaType.Math:
          node = this.createTextNode(innerArea);
          break;
        default:
          return;
      }
      contentNodes.push(node);
    });
    let inputNode: Node = inputContentType.create(
      { id: area.id },
      contentNodes,
    );
    console.log(inputNode);
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
    let textNode: Node = collapsibleTitleNodeType.create(null, [
      ProofFlowSchema.text(title),
    ]);

    // Create the content nodes
    let contentNodes: Node[] = [];
    area.subAreas.forEach((innerArea) => {
      let node: Node;
      switch (innerArea.type) {
        case AreaType.Text:
          node = this.createTextNode(innerArea);
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
    let contentNode: Node = collapsibleContentType.create(
      { visible: true },
      contentNodes,
    );

    // Create the collapsible node
    let collapsibleNode: Node = collapsibleNodeType.create({ id: area.id }, [
      textNode,
      contentNode,
    ]);

    // Insert the collapsible node at the end of the editor
    this.insertAtEnd(collapsibleNode);
  }

  /**
   * Creates a text node with the specified text.
   *
   * @param text - The text content of the node.
   * @returns The created text node.
   */
  private createTextNode(area: Area): Node {
    let textNode: Node = markdownblockNodeType.create({ id: area.id }, [
      ProofFlowSchema.text(area.content),
    ]);
    return textNode;
  }

  /**
   * Creates a code node with the specified text.
   *
   * @param text - The text to be included in the code node.
   * @returns The created code node.
   */
  private createCodeNode(area: Area): Node {
    let textNode: Node = codeblockNodeType.create({ id: area.id }, [
      ProofFlowSchema.text(area.content),
    ]);
    return textNode;
  }

  /**
   * Creates a math node with the specified text.
   *
   * @param text - The text to be included in the math node.
   * @returns The created math node.
   */
  private createMathNode(area: Area): Node {
    let textNode: Node = mathblockNodeType.create({ id: area.id }, [
      ProofFlowSchema.text(area.content),
    ]);
    return textNode;
  }

  /**
   * Creates a new text area in the editor and inserts the specified text.
   *
   * @param text - The text to be inserted in the text area.
   */
  public createTextArea(area: Area): void {
    let textNode = this.createTextNode(area);
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
    const content = this.editorView.state.doc;
    const result = getContent(content);
    const blob = new Blob([result], { type: "text" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = this.fileName;
    document.body.appendChild(a);
    a.click();

    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  /**
   * Resets the editor by destroying the minimap, removing all children from the editor and content elements,
   * and creating a new editor view.
   */
  public reset() {
    this.minimap?.destroy();
    this.removeGlobalKeyBindings()

    // Remove all children from the editor element
    while (this._editorElem.firstChild != null) {
      this._editorElem.removeChild(this._editorElem.firstChild);
    }

    // Remove all children from the content element
    while (this._contentElem.firstChild != null) {
      this._contentElem.removeChild(this._contentElem.firstChild);
    }

    // Create a new editor view
    this.editorView = this.createEditorView();
    this.removeGlobalKeyBindings = applyGlobalKeyBindings(
      this.editorView,
      this.minimap!,
    );
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
  public switchUserMode(UserModebutton: HTMLElement) {
    let newUserMode: UserMode;
    newUserMode =
      this.userMode === UserMode.Teacher ? UserMode.Student : UserMode.Teacher;
    UserModebutton.textContent =
      newUserMode === UserMode.Student ? "Student Mode" : "Teacher Mode";
    this.userMode = newUserMode;
    handleUserModeSwitch();
  }
}
