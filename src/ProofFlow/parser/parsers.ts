import {
  CoqMDOutput,
  CoqOutput,
  LeanOutput,
  PureLeanOutput,
} from "./outputconfigs";
import { SimpleParser } from "./parser";

export { CoqParser, CoqMDParser, LeanParser, PureLeanParser };

const CoqParser = new SimpleParser(
  {
    text: [/\n\(\*\*/, /\*\)\n/],
    math: [/\$\$/, /\$\$/],
    collapsible: [
      /\n\(\*<hint(?: title="(.*?)")?>\*\)\n/,
      /\n\(\*<\/hint>\*\)\n/,
    ],
    input: [/\n\(\*<input-area>\*\)\n/, /\n\(\*<\/input-area>\*\)\n/],
  },
  CoqOutput,
);

const CoqMDParser = new SimpleParser(
  {
    code: [/\n```coq\n/, /\n```\n/],
    math: [/\$\$/, /\$\$/],
    collapsible: [/<hint(?: title="(.*?)")?>/, /<\/hint>/],
    input: [/<input-area>/, /<\/input-area>/],
  },
  CoqMDOutput,
);

const LeanParser = new SimpleParser(
  {
    code: [/\n```lean\n/, /\n```\n/],
    math: [/\n:::math\n/, /\n:::\n/],
    collapsible: [/\n:::collapsible\n(?:#(.*?)\n)?/, /\n:::\n/],
    input: [/\n:::input\n\.\n/, /\n:::\n/],
  },
  LeanOutput,
);

const PureLeanParser = new SimpleParser(
  {
    text: [/\n\/-\n/, /\n-\/\n/],
    math: [/\n\/-\$\$\n/, /\n\$\$-\/\n/],
    collapsible: [/\n-- <hint(?: title="(.*?)")?>\n?/, /\n-- <\/hint>\n/],
    input: [/\n-- <input-area>\n/, /\n-- <\/input-area>\n/],
  },
  PureLeanOutput,
);
