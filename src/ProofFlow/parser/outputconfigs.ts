import { OutputConfig } from "../editor/ProofFlowDocument";

export { CoqOutput, CoqMDOutput, LeanOutput, PureLeanOutput };

const CoqOutput: OutputConfig = {
  text: ["(**", "*)"],
  code: ["", ""],
  math: ["$$", "$$"],
  collapsible: ["<hint>", "</hint>"],
  collapsibletitle: ['<hint title="TITLE">\n', "\n</hint>"],
  input: ["<input-area>\n", "\n</input-area>"],
};

const CoqMDOutput: OutputConfig = {
  text: ["", ""],
  code: ["\n```coq\n", "\n```"],
  math: ["$$", "$$"],
  collapsible: ["<hint>", "\n</hint>"],
  collapsibletitle: ['<hint title="TITLE">', "\n</hint>"],
  input: ["<input-area>", "\n</input-area>"],
};

const LeanOutput: OutputConfig = {
  text: ["", ""],
  code: ["```lean\n", "```\n"],
  math: [":::math\n", ":::\n"],
  collapsible: [":::collapsible\n", ":::\n"],
  collapsibletitle: [":::collapsible\n# TITLE\n", ":::\n"],
  input: [":::input\n", ":::\n"],
};

const PureLeanOutput: OutputConfig = {
  text: ["\n/-\n", "\n-/\n"],
  code: ["", ""],
  math: ["\n/-$$\n", "\n$$-/\n"],
  collapsible: ["\n-- <hint>\n)?", "\n-- </hint>\n"],
  collapsibletitle: ['\n-- <hint title="TITLE">\n', "\n-- </hint>\n"],
  input: ["\n-- <input-area>\n", '\n-- <"input-area>\n'],
};
