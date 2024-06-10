import { NodeType, Node } from "prosemirror-model";
import { CodeMirrorView } from "../codemirror";

export function getContent(node: Node): string {
  let result: string = "";

  const nodeType = node.type;
  console.log(nodeType);
  if (nodeType.isBlock) {
    console.log(nodeType);
    if (nodeType.name == "math_display") {
      result += "$$\n" + node.textContent + "\n$$\n";
      return result;
    }
    node.content.forEach((child) => {
      result += getContent(child);
    });
  }
  if (nodeType.isText) {
    result += node.text + "\n";
  }

  return result;
}

export function getLSPFileCoqMV() {
  let result = "";
  result += "```coq\n";
  CodeMirrorView.instances.forEach((instance) => {
    result += instance.cm.state.doc.toString() + '\n';
  })
  result += "```\n";
  return result;
}

export function getLSPFileCoqV() {
  let result = "";
  CodeMirrorView.instances.forEach((instance) => {
    result += instance.cm.state.doc.toString() + '\n';
  })
  return result;
}