import { NodeType, Node, Schema } from "prosemirror-model";
import { EditorState, EditorStateConfig, Plugin, Transaction } from "prosemirror-state";
import { Decoration, DecorationSet, EditorView } from "prosemirror-view";
import { findChildrenWithType } from "./utils";

export const createCollapsiblePlugin = (schema: Schema): Plugin => {
    const collapsibleNodeType = schema.nodes.collapsible;

    const plugin = new Plugin<DecorationSet>({
        state: {
            init(config: EditorStateConfig, instance: EditorState) {
                return getCollapsibleDecorations(instance, collapsibleNodeType);
            },
            apply(tr: Transaction, 
                value: DecorationSet, 
                oldState: EditorState, 
                newState: EditorState) {
                return tr.docChanged ? getCollapsibleDecorations(newState, collapsibleNodeType) : value;
            },
        },
        props: {
            decorations(state: EditorState) {
                return this.getState(state);
            }
        }
    });
    return plugin;
}

function getCollapsibleDecorations(state: EditorState, collapsibleNodeType: NodeType): DecorationSet {
	const collapsibles = findChildrenWithType(state.doc, collapsibleNodeType)
		.filter(result => result.node.content.size > 0);

	const decorations = collapsibles.map((collapsible) => {
		const widgetDeco = Decoration.widget(collapsible.pos,
			(view: EditorView) => createCollapseDOM(view, collapsible), 
			{side: -1});
		return widgetDeco;
	});
	const collapsibleDecorationSet = DecorationSet.create(state.doc, decorations);
	return collapsibleDecorationSet;
}

function createCollapseDOM(view: EditorView, collapsible: {node: Node, pos: number}) {
	const collapsibleElement = document.createElement("div");
	collapsibleElement.classList.add("collapsible-title-element");
	collapsibleElement.textContent = collapsible.node.attrs.title;
	collapsibleElement.addEventListener("click", (ev: MouseEvent) => {
		const state = view.state.doc.nodeAt(collapsible.pos)?.attrs.visible as boolean;
		const trans = view.state.tr.setNodeAttribute(collapsible.pos, "visible", !state);
		view.dispatch(trans);
	});
	return collapsibleElement;
}