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

function updateInstance(instance: CodeMirrorView, lineStart: number) {
  let lineCount =  instance.cm.state.doc.lines;
  let lineOffsets: number[] = [0];
  for (let i = 2; i <= lineCount; i++) {
    lineOffsets.push(instance.cm.state.doc.line(i - 1).length + 1);
    lineOffsets[i - 1] += lineOffsets[i - 2];
  }

  instance.lineStart = lineStart;
  instance.lineOffsets = lineOffsets;
  lineStart += lineCount;
  return lineStart;
}

export function getLSPFileCoqMV() {
  let count = 2;
  let message = "";
  message += "```coq\n";
  let lineStart = 1;
  CodeMirrorView.instances.forEach((instance) => {
    message += instance.cm.state.doc.toString() + '\n';
    count += instance.cm.state.doc.lines;
    lineStart = updateInstance(instance, lineStart);
  })
  message += "```\n";
  let result = {message: message, lines: count};
  return result;
}

export function getLSPFileCoqV() {
  let count = 0;
  let message = "";
  let lineStart = 0;
  CodeMirrorView.instances.forEach((instance) => {
    message += instance.cm.state.doc.toString() + '\n';
    count += instance.cm.state.doc.lines;
    lineStart = updateInstance(instance, lineStart);
  })
  let result = {message: message, lines: count};
  return result;
}