import {
  CoqMDOutput,
  CoqOutput,
  LeanOutput,
  PureLeanOutput,
} from "./outputconfigs";
import { SimpleParser } from "./parser";

/**
 * Regexes for parsing Coq and Lean documents with ProofFlow
 */
export { CoqParser, CoqMDParser, LeanParser, PureLeanParser };

/**
 * Parser for purely Coq documents
 */
const CoqParser = new SimpleParser(
  {
    // Regular expressions
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

/**
 * Parser for Coq documents with Markdown
 */
const CoqMDParser = new SimpleParser(
  {
    // Regular expressions
    code: [/\n```coq\n/, /\n```\n/],
    math: [/\$\$/, /\$\$/],
    collapsible: [/<hint(?: title="(.*?)")?>/, /<\/hint>/],
    input: [/<input-area>/, /<\/input-area>/],
  },
  CoqMDOutput,
);

/**
 * Parser for Lean documents that can contain Verso genre
 */
const LeanParser = new SimpleParser(
  {
    // Regular expressions
    code: [/\n```lean\n/, /\n```\n/],
    math: [/\n:::math\n/, /\n:::\n/],
    collapsible: [/\n:::collapsible\n(?:#(.*?)\n)?/, /\n:::\n/],
    input: [/\n:::input\n\.\n/, /\n:::\n/],
  },
  LeanOutput,
);

/**
 * Parser for purely Lean documents
 */
const PureLeanParser = new SimpleParser(
  {
    // Regular expressions
    text: [/\n\/-\n/, /\n-\/\n/],
    math: [/\n\/-\$\$\n/, /\n\$\$-\/\n/],
    collapsible: [/\n-- <hint(?: title="(.*?)")?>\n?/, /\n-- <\/hint>\n/],
    input: [/\n-- <input-area>\n/, /\n-- <\/input-area>\n/],
  },
  PureLeanOutput,
);
