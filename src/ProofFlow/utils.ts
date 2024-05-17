import { NodeType, Node } from "prosemirror-model";

export function findChildrenWithType(node: Node, type: NodeType): {node: Node, pos: number}[] {
   let result: {node: Node, pos: number}[] = [];
   node.descendants((child, pos) => {
	   if (child.type === type) result.push({node: child, pos});
	   return false;
   });
   return result;
}