import { NodeType, Node } from "prosemirror-model";

export function getContent(node: Node): string {
  let result: string = "";

  const nodeType = node.type;
  console.log(nodeType);
  if (nodeType.isBlock) {
    node.content.forEach((child) => {
      result += getContent(child);
    });
  }
  if (nodeType.isText) {
    result += node.text;
  }

  return result;
}
