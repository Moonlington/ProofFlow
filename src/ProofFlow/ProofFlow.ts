import { Schema, DOMParser, NodeType, Node } from "prosemirror-model";
import { CodeMirrorView } from "./CodeMirror";
import type { GetPos } from "./CodeMirror/types";
import { ProofFlowSchema } from "./proofflowschema.ts";

import {
  EditorState,
  EditorStateConfig,
  Transaction,
  Selection,
  TextSelection,
  NodeSelection,
} from "prosemirror-state";
import { DirectEditorProps, EditorView } from "prosemirror-view";
import { createPlugins } from "./plugins.ts";
import { mathSerializer } from "@benrbray/prosemirror-math";
import { Area, AreaType } from "./parser/area";
import {
  parseToAreasMV,
  parseToAreasV,
  parseToProofFlow,
  parseToAreasLean,
} from "./parser/parse-to-proofflow.ts";
import { ButtonBar } from "./ButtonBar";
import { getContent } from "./outputparser/savefile";
import { schema } from "prosemirror-markdown";
import { minimalSetup } from "codemirror";
import { javascript } from "@codemirror/lang-javascript";
import {
  defaultMarkdownParser,
  defaultMarkdownSerializer,
} from "prosemirror-markdown";
import { applyGlobalKeyBindings } from "./commands/shortcuts";
import { Wrapper, WrapperType } from "./parser/wrapper.ts";
import { mathblockNodeType, codeblockNodeType, collapsibleNodeType, markdownblockNodeType, collapsibleTitleNodeType, collapsibleContentType } from "./nodetypes.ts";
// CSS

export class ProofFlow {
  private _schema: Schema; // The schema for the editor
  private _editorElem: HTMLElement; // The HTML element that serves as the editor container
  private _contentElem: HTMLElement; // The HTML element that contains the initial content for the editor

  private editorView: EditorView; // The view of the editor

  private fileName: string = "file.txt";

  /**
   * Represents the ProofFlow class.
   * @constructor
   * @param {HTMLElement} editorElem - The HTML element that serves as the editor container.
   * @param {HTMLElement} contentElement - The HTML element that contains the initial content for the editor.
   */
  constructor(editorElem: HTMLElement, contentElement: HTMLElement) {
    this._schema = ProofFlowSchema; // Set the schema for the editor
    this._editorElem = editorElem; // Set the editor element
    this._contentElem = contentElement; // Set the content element

    // Create the editor state
    let editorStateConfig: EditorStateConfig = {
      schema: ProofFlowSchema,
      doc: DOMParser.fromSchema(ProofFlowSchema).parse(this._contentElem),
      plugins: createPlugins(ProofFlowSchema),
    };
    const editorState = EditorState.create(editorStateConfig);

    // Create the editor view
    let directEditorProps: DirectEditorProps = {
      state: editorState,
      clipboardTextSerializer: (slice) => {
        return mathSerializer.serializeSlice(slice);
      },
      handleClickOn(view, pos, node, nodePos, event, direct) {
          if (node.type.name == "collapsible_title") {
            let startPos = nodePos + node.nodeSize;
            //let contentNode = view.state.doc.nodeAt(startPos);
            //console.log(contentNode);
            const state = view.state.doc.nodeAt(startPos)?.attrs.visible as boolean;
            let trans = view.state.tr.setNodeAttribute(startPos, "visible", !state);
            
            view.dispatch(trans);
          }
        
          if (node.type.name === undefined || !direct) return;

          let trans = view.state.tr;

          let cursorOffset = pos;
          let thisPos = nodePos
          let correctPos = 0;
          let offsetToClicked = 0;
          let newNodes = Array<Node>();

          view.state.doc.descendants((node, pos) => {
            if (!(node.type.name === "markdown_rendered" || node.type.name === "collapsible" || node.type.name === "markdown" || node.type.name === "code_mirror" || node.type.name === "math_display")) return false;

            // Check if the clicked node is the same as the current node
            let isClickedNode: Boolean = pos <= thisPos && thisPos <= pos + node.nodeSize - 1;
            let newNode: Node = node;

            if (!isClickedNode && node.type.name === "markdown") {
                const parsedContent = defaultMarkdownParser.parse(node.textContent);

                if (parsedContent) {
                  const markdownRenderedNodeType = ProofFlowSchema.nodes["markdown_rendered"];
                  newNode = markdownRenderedNodeType.create(null, parsedContent.content);
                } 
              }

            // Check if this node position is the same as the clicked node position
            else if (isClickedNode && node.type.name === "markdown_rendered") {
                const serializedContent = defaultMarkdownSerializer.serialize(node);

              // Create a new markdown node with the serialized content (a.k.a the raw text)
              // Make sure the text is not empty, since creating an empty text cell is not allowed
              let text = serializedContent == "" ? " " : serializedContent;
              const markdownNodeType = ProofFlowSchema.nodes["markdown"];
              newNode = markdownNodeType.create(null, [ProofFlowSchema.text(text)]);

            } 

            if (isClickedNode) {
              offsetToClicked += cursorOffset - thisPos; 
              correctPos = offsetToClicked;
            }

            offsetToClicked += newNode.nodeSize;
            newNodes.push(newNode);

          });

          trans.replaceWith(0, view.state.doc.content.size, newNodes);
          trans.setSelection(TextSelection.near(trans.doc.resolve(correctPos), -1));
          view.dispatch(trans);
      },
       
      // Define a node view for the custom code mirror node as a prop
      nodeViews: {
        code_mirror: (node: Node, view: EditorView, getPos: GetPos) =>
          new CodeMirrorView({
            node,
            view,
            getPos,
            cmOptions: {
              extensions: [minimalSetup, javascript()],
            },
          }),
      },
    };
    this.editorView = new EditorView(this._editorElem, directEditorProps);

    // Create the button bar and render it
    const buttonBar = new ButtonBar(this._schema, this.editorView);
    buttonBar.render(this._editorElem);

    // Apply global keymap and input rules
    applyGlobalKeyBindings(this.editorView);
  }

  public openFile(wrappers: Wrapper[]): void {
    // console.log(wrappers);
    for (let wrapper of wrappers) {
      // Create text or code areas based on the parsed content
      // console.log(wrapper);
      // console.log(wrapper.wrapperType);
      if (wrapper.wrapperType == WrapperType.Collapsible) {
        this.createCollapsible(wrapper);
      } else {
        for (let area of wrapper.areas) {
          if (area.areaType == AreaType.Markdown) {
            this.createTextArea(area.text);
          } else if (area.areaType == AreaType.Code) {
            this.createCodeArea(area.text);
          } else if (area.areaType == AreaType.Math) {
            this.createMathArea(area.text);
          }
        }
      }
    }
  }

  /**
   * Opens the original Coq file and creates text or code areas based on the parsed content.
   *
   * @param text - The content of the Coq file.
   */
  public openOriginalCoqFile(text: string): void {
    // Parse the text to create the proof flow
    let wrappers = parseToProofFlow(text, parseToAreasV);
    this.openFile(wrappers);
  }

  /**
   * Opens the markdown Coq file and creates text or code areas based on the parsed content.
   *
   * @param text - The content of the Coq file.
   */
  public openMarkdownCoqFile(text: string): void {
    // Parse the text to create the proof flow
    let wrappers = parseToProofFlow(text, parseToAreasMV);
    this.openFile(wrappers);
  }

  /**
   * Opens the markdown Lean file and creates text or code areas based on the parsed content.
   *
   * @param text - The content of the Lean file.
   */
  public openLeanFile(text: string): void {
    // Parse the text to create the proof flow
    let wrappers = parseToProofFlow(text, parseToAreasLean);
    this.openFile(wrappers);
  }

  public getState(): EditorState {
    return this.editorView.state;
  }

  private insertAtEnd(node: Node) {
    // Create a new transaction and get the counter
    let trans: Transaction = this.getState().tr;
    let counter = this.getState().doc.content.size;

    trans = trans.setSelection(Selection.atEnd(this.getState().doc));
    trans = trans.insert(counter, node);
    this.editorView.state = this.editorView.state.apply(trans);
    this.editorView.updateState(this.editorView.state);
  }

  public createCollapsible(wrapper: Wrapper) {
    const title = wrapper.info;

    let textNode: Node = collapsibleTitleNodeType.create(null, [
      ProofFlowSchema.text(title),
    ]);

    let contentNodes: Node[] = [];

    wrapper.areas.forEach((area) => {
      if (area.areaType == AreaType.Code) {
        const node = this.createCodeNode(area.text);
        contentNodes.push(node);
      } else if (area.areaType == AreaType.Math) {
        const node = this.createMathNode(area.text);
        contentNodes.push(node);
      } else if (area.areaType == AreaType.Markdown) {
        const node = this.createTextNode(area.text);
        contentNodes.push(node);
      }
    });
    let contentNode: Node = collapsibleContentType.create(
      { visible: true },
      contentNodes,
    )
    let collapsibleNode: Node = collapsibleNodeType.create({}, [textNode, contentNode]);
    this.insertAtEnd(collapsibleNode);
  }

  private createTextNode(text: string): Node {
    let textNode: Node = markdownblockNodeType.create(null, [
      ProofFlowSchema.text(text),
    ]);
    return textNode;
  }

  private createCodeNode(text: string): Node {
    let textNode: Node = codeblockNodeType.create(null, [
      ProofFlowSchema.text(text),
    ]);
    return textNode;
  }

  private createMathNode(text: string): Node {
    let textNode: Node = mathblockNodeType.create(null, [
      ProofFlowSchema.text(text),
    ]);
    return textNode;
  }

  /**
   * Creates a new text area in the editor and inserts the specified text.
   *
   * @param text - The text to be inserted in the text area.
   */
  public createTextArea(text: string): void {
    let textNode = this.createTextNode(text);
    this.insertAtEnd(textNode);
  }

  /**
   * Creates a new code area in the editor and inserts the specified code.
   *
   * @param text - The code to be inserted in the code area.
   */
  public createCodeArea(text: string): void {
    let codeNode = this.createCodeNode(text);
    this.insertAtEnd(codeNode);
  }

  /**
   * Creates a new math area in the editor and inserts the specified math.
   *
   * @param text - The math to be inserted in the math area.
   */
  public createMathArea(text: string): void {
    let mathNode = this.createMathNode(text);
    this.insertAtEnd(mathNode);
  }

  public setFileName(fileName: string) {
    this.fileName = fileName;
  }

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
}