import { OutputConfig } from "../editor/ProofFlowDocument";

export { CoqOutput, CoqMDOutput, LeanOutput };

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
