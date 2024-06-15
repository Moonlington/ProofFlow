import {
  Position,
  ProofFlowDocument,
  Range,
} from "../editor/ProofFlowDocument.ts";
import {
  CompletionItem,
  CompletionList,
  Hover,
  InitializeResult,
  SignatureHelp,
} from "./models.ts";

type RangeResponse = Range | Range[];

export interface LSPClientHandler {
  // Lifecycle Messages
  initialize(): Promise<InitializeResult>;
  initialized(): void;
  shutdown(): void;
  exit(): void;

  // Document Synchronization
  didOpen(pfDocument: ProofFlowDocument): void;
  didChange(pfDocument: ProofFlowDocument): void;
  didClose(): void;

  // Language Features
  // documentSymbol(params: DocumentSymbolParams): DocumentSymbol[] | SymbolInformation[] | null
  references(pos: Position): Promise<Range[] | null>;
  definition(pos: Position): Promise<RangeResponse | null>;
  typeDefinition(pos: Position): Promise<RangeResponse | null>;
  signatureHelp(pos: Position): Promise<SignatureHelp | null>;
  hover(pos: Position): Promise<Hover | null>;
  gotoDeclaration(pos: Position): Promise<RangeResponse | null>;
  completion(
    pos: Position,
    char: string,
  ): Promise<CompletionItem[] | CompletionList | null>;
}
