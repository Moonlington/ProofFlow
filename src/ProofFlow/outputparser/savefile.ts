import { Node } from "prosemirror-model";
import { CodeMirrorView } from "../codemirror/codemirrorview";

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
  let count = 2;
  let message = "";
  message += "```coq\n";
  CodeMirrorView.instances.forEach((instance) => {
    message += instance.cm.state.doc.toString() + "\n";
    count += instance.cm.state.doc.lines;
  });
  message += "```\n";
  let result = { message: message, lines: count };
  return result;
}

export function getLSPFileCoqV() {
  let count = 0;
  let message = "";
  CodeMirrorView.instances.forEach((instance) => {
    message += instance.cm.state.doc.toString() + "\n";
    count += instance.cm.state.doc.lines;
  });
  let result = { message: message, lines: count };
  return result;
}
