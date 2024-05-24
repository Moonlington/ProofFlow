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
import { parseToAreasMV, parseToAreasV, parseToProofFlow } from "./parser/coq-to-proofflow";
import { ButtonBar } from "./ButtonBar";
import { getContent } from "./outputparser/savefile";
import { schema } from "prosemirror-markdown";
import { minimalSetup } from "codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { defaultMarkdownParser, defaultMarkdownSerializer } from "prosemirror-markdown";
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
      plugins: createPlugins(this._schema),
    };
    const editorState = EditorState.create(editorStateConfig);

    // Create the editor view
    let directEditorProps: DirectEditorProps = {
      state: editorState,
      clipboardTextSerializer: (slice) => {
        return mathSerializer.serializeSlice(slice);
      },
      handleClickOn(view, pos, node, nodePos, event, direct) {
          if (node.type.name === undefined) return;
          //if (node.type.name !== "markdown_rendered") return;
          //const state = view.state;
          let trans = view.state.tr;
          const thisNode = node;
          const thisPos = nodePos
          const savedDoc = view.state.doc;

          view.state.doc.descendants((node, pos) => {

            console.log("b4 " + node.type.name + " current node pos: " + pos + " clicked node pos: " + nodePos)
            // Check if clicked node position is not the same as the current node position
            if ((nodePos < pos || nodePos > pos + node.nodeSize - 1) && node.type.name === "markdown") {

                console.log(node.type.name + " " + pos)
                const parsedContent = defaultMarkdownParser.parse(node.textContent);
                console.log("parsed content: " + parsedContent!.content)
                if (parsedContent) {
                  let sizeOffset = node.nodeSize;
                  let nodeStart = pos;
                  let nodeEnd = nodeStart + sizeOffset - 1;
                  console.log("s + e +c: " + nodeStart + " " + nodeEnd + " " + sizeOffset)
                  const markdownRenderedNodeType = ProofFlowSchema.nodes["markdown_rendered"];
                  let newMarkdownNode = markdownRenderedNodeType.create(null, parsedContent.content);
                  trans.replaceRangeWith(
                    nodeStart,
                    nodeEnd,
                    newMarkdownNode
                  );
                } 
              }

              // Check if this node position is the same as the clicked node position
              if (pos <= thisPos && thisPos < pos + node.nodeSize  && node.type.name === "markdown_rendered") {
                const serializedContent = defaultMarkdownSerializer.serialize(node);
                console.log(node.textContent);
                let sizeOffset = node.nodeSize;
                let nodeStart = pos; 
                let nodeEnd = nodeStart + sizeOffset - 1; 
                console.log("md ren s + e +c: " + nodeStart + " " + nodeEnd + " " + sizeOffset)
  
                // Create a new markdown node with the serialized content (a.k.a the raw text)
                // Make sure the text is not empty, since creating an empty text cell is not allowed
                let text = serializedContent == "" ? "empty" : serializedContent;
                console.log("MAking markdown node with text: " + text)
                const markdownNodeType = ProofFlowSchema.nodes["markdown"];
                let newMarkdownNode = markdownNodeType.create(null, [ProofFlowSchema.text(text)]);
  
                // Create and push the transaction of replacing the markdown-rendered node with the markdown raw text node
                trans.replaceRangeWith(
                  nodeStart,
                  nodeEnd,
                  newMarkdownNode
                );
              }
          });
          
          view.dispatch(trans);
      },
      /*handleDOMEvents: {     
        blur: (view, event) => {
          // If the selection is not in a markdow node (or undefined), return
          if (view.state.selection.$to.node(1) === undefined) return;
          if (view.state.selection.$to.node(1).type.name !== "markdown") return;

          let trans = view.state.tr;
          const textblockNodeType = ProofFlowSchema.nodes["markdown_rendered"];
          
          // Parse the content and create a new markdown node with the parsed content
          const parsedContent = defaultMarkdownParser.parse(view.state.selection.$from.node().textContent);
          if (parsedContent) {
            let cursorOffset = view.state.selection.$from.parentOffset;
            let nodeStart = view.state.selection.$from.pos - cursorOffset - 1;
            let nodeEnd = nodeStart + view.state.selection.$from.node().textContent.length + 1;

            let newMarkdownNode = textblockNodeType.create(null, parsedContent.content);
            trans = trans.replaceRangeWith(
              nodeStart,
              nodeEnd,
              newMarkdownNode
            );
        
            let newState = view.state.apply(trans);
            view.updateState(newState);
          } 
          return false;    
        }      
      },*/
      
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
  }

  /**
   * Opens the original Coq file and creates text or code areas based on the parsed content.
   *
   * @param text - The content of the Coq file.
   */
  public openOriginalCoqFile(text: string): void {
    // Parse the text to create the proof flow
    let wrappers = parseToProofFlow(text, parseToAreasV);
    console.log(wrappers);
    for (let wrapper of wrappers) {
      // Create text or code areas based on the parsed content
      console.log(wrapper);
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

  /**
   * Opens the markdown Coq file and creates text or code areas based on the parsed content.
   *
   * @param text - The content of the Coq file.
   */
  public openMarkdownCoqFile(text: string): void {
    // Parse the text to create the proof flow
    let wrappers = parseToProofFlow(text, parseToAreasMV);
    console.log(wrappers);
    for (let wrapper of wrappers) {
      // Create text or code areas based on the parsed content
      console.log(wrapper);
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

  public getState(): EditorState {
    return this.editorView.state;
  }

  /**
   * Creates a new text area in the editor and inserts the specified text.
   *
   * @param text - The text to be inserted in the text area.
   */
  public createTextArea(text: string): void {
    // Create a new transaction and get the counter
    let trans: Transaction = this.getState().tr;
    let counter = this.getState().doc.content.size;

    // Create a new text node and insert it at the end of the document
    const textblockNodeType = ProofFlowSchema.nodes["markdown"];
    let textNode: Node = textblockNodeType.create(null, [
      ProofFlowSchema.text(text),
    ]);
    trans = trans.setSelection(Selection.atEnd(this.getState().doc));
    trans = trans.insert(counter, textNode);
    this.editorView.state = this.editorView.state.apply(trans);
    this.editorView.updateState(this.editorView.state);
  }

  /**
   * Creates a new code area in the editor and inserts the specified code.
   *
   * @param text - The code to be inserted in the code area.
   */
  public createCodeArea(text: string): void {
    let trans: Transaction = this.getState().tr;
    let counter = this.getState().doc.content.size;
    const codeblockNodeType = ProofFlowSchema.nodes["code_mirror"];
    let codeNode: Node = codeblockNodeType.create(null, [
      ProofFlowSchema.text(text),
    ]);
    trans = trans.setSelection(Selection.atEnd(this.getState().doc));
    trans = trans.insert(counter, codeNode);
    this.editorView.state = this.editorView.state.apply(trans);
    this.editorView.updateState(this.editorView.state);
  }

  /**
   * Creates a new math area in the editor and inserts the specified math.
   *
   * @param text - The math to be inserted in the math area.
   */
  public createMathArea(text: string): void {
    let trans: Transaction = this.getState().tr;
    let counter = this.getState().doc.content.size;
    const mathblockNodeType = ProofFlowSchema.nodes["math_display"];
    let mathNode: Node = mathblockNodeType.create(null, [
      ProofFlowSchema.text(text),
    ]);
    trans = trans.setSelection(Selection.atEnd(this.getState().doc));
    trans = trans.insert(counter, mathNode);
    this.editorView.state = this.editorView.state.apply(trans);
    this.editorView.updateState(this.editorView.state);
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