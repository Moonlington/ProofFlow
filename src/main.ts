import { ProofFlow } from "./ProofFlow/ProofFlow";
import "./index.css";
import "@benrbray/prosemirror-math/dist/prosemirror-math.css";
import "katex/dist/katex.min.css";

let editorElement: HTMLElement = document.querySelector("#editor")!;
let contentElement: HTMLElement = document.querySelector("#content")!;

let proofFlow: ProofFlow = new ProofFlow(editorElement, contentElement);
