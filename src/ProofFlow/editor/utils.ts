import { NodeType, Node } from "prosemirror-model";
import {CodeMirrorView} from "../codemirror";
import {Wrapper, WrapperType} from "../parser/wrapper.ts";
import {AreaType} from "../parser/area.ts";
import {parseToAreasLean, parseToAreasMV, parseToAreasV, parseToProofFlow} from "../parser/parse-to-proofflow.ts";
import {EditorState, Selection, Transaction} from "prosemirror-state";
import {
  codeblockNodeType,
  collapsibleContentType,
  collapsibleNodeType,
  collapsibleTitleNodeType,
  markdownblockNodeType, mathblockNodeType
} from "./nodetypes.ts";
import {ProofFlowSchema} from "./proofflowschema.ts";
import {getContent} from "../outputparser/savefile.ts";
import {ProofFlow} from "./ProofFlow.ts";

export class Utils {


  findChildrenWithType(
      node: Node,
      type: NodeType,
  ): { node: Node; pos: number }[] {
    let result: { node: Node; pos: number }[] = [];
    node.descendants((child, pos) => {
      if (child.type === type) result.push({node: child, pos});
      return false;
    });
    return result;
  }


  /**
   * Synchronizes the ProseMirror selection with the CodeMirror selection.
   * Helps with navigating from code mirror to other node types
   */
  static syncProseMirrorToCodeMirror(pf: ProofFlow) {
    const {state} = pf.editorView;
    const {selection} = state;

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

  openFile(wrappers: Wrapper[], pf: ProofFlow): void {
    // console.log(wrappers);
    for (let wrapper of wrappers) {
      // Create text or code areas based on the parsed content
      // console.log(wrapper);
      // console.log(wrapper.wrapperType);
      if (wrapper.wrapperType == WrapperType.Collapsible) {
        this.createCollapsible(wrapper, pf);
      } else {
        for (let area of wrapper.areas) {
          if (area.areaType == AreaType.Markdown) {
            this.createTextArea(area.text, pf);
          } else if (area.areaType == AreaType.Code) {
            this.createCodeArea(area.text, pf);
          } else if (area.areaType == AreaType.Math) {
            this.createMathArea(area.text, pf);
          }
        }
      }
    }
  }

  /**
   * Opens the original Coq file and creates text or code areas based on the parsed content.
   * @param pf - The proof flow object.
   * @param text - The content of the Coq file.
   */

   openOriginalCoqFile(text: string, pf: ProofFlow): void {
    // Parse the text to create the proof flow
    let wrappers = parseToProofFlow(text, parseToAreasV);
    this.openFile(wrappers, pf);
  }

  /**
   * Opens the markdown Coq file and creates text or code areas based on the parsed content.
   * @param pf - The proof flow object.
   * @param text - The content of the Coq file.
   */
  openMarkdownCoqFile(text: string, pf: ProofFlow): void {
    // Parse the text to create the proof flow
    let wrappers = parseToProofFlow(text, parseToAreasMV);
    this.openFile(wrappers, pf);
  }

  /**
   * Opens the markdown Lean file and creates text or code areas based on the parsed content.
   * @param pf - The proof flow object.
   * @param text - The content of the Lean file.
   */

  openLeanFile(text: string, pf: ProofFlow): void {
    // Parse the text to create the proof flow
    let wrappers = parseToProofFlow(text, parseToAreasLean);
    this.openFile(wrappers, pf);
  }


  getState(pf: ProofFlow): EditorState {
    return pf.editorView.state;
  }

  insertAtEnd(node: Node, pf: ProofFlow) {
    // Create a new transaction and get the counter
    let trans: Transaction = this.getState(pf).tr;
    let counter = this.getState(pf).doc.content.size;

    trans = trans.setSelection(Selection.atEnd(this.getState(pf).doc));
    trans = trans.insert(counter, node);
    pf.editorView.state = pf.editorView.state.apply(trans);
    pf.editorView.updateState(pf.editorView.state);
  }


  createCollapsible(wrapper: Wrapper, pf: ProofFlow) {
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
        {visible: true},
        contentNodes,
    );
    let collapsibleNode: Node = collapsibleNodeType.create({}, [
      textNode,
      contentNode,
    ]);
    this.insertAtEnd(collapsibleNode, pf);
  }



  createTextNode(text: string): Node {
    let textNode: Node = markdownblockNodeType.create(null, [
      ProofFlowSchema.text(text),
    ]);
    return textNode;
  }



  createCodeNode(text: string): Node {
    let textNode: Node = codeblockNodeType.create(null, [
      ProofFlowSchema.text(text),
    ]);
    return textNode;
  }

  createMathNode(text: string): Node {
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

  createTextArea(text: string, pf: ProofFlow): void {
    let textNode = this.createTextNode(text);
    this.insertAtEnd(textNode, pf);
  }

  /**
   * Creates a new code area in the editor and inserts the specified code.
   *
   * @param text - The code to be inserted in the code area.
   */

  createCodeArea(text: string, pf:ProofFlow): void {
    let codeNode = this.createCodeNode(text);
    this.insertAtEnd(codeNode, pf);
  }

  /**
   * Creates a new math area in the editor and inserts the specified math.
   *
   * @param text - The math to be inserted in the math area.
   */


  createMathArea(text: string, pf: ProofFlow): void {
    let mathNode = this.createMathNode(text);
    this.insertAtEnd(mathNode, pf);
  }


  setFileName(fileName: string, pf: ProofFlow) {
    pf.fileName = fileName;
  }



  saveFile(pf: ProofFlow) {
    const content = pf.editorView.state.doc;
    const result = getContent(content);
    const blob = new Blob([result], {type: "text"});
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = pf.fileName;
    document.body.appendChild(a);
    a.click();

    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

}
