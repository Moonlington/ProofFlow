export { LSPClientHandler };

import * as m from "./models.ts";
import {
  Position,
  ProofFlowDocument,
  Range,
} from "../editor/ProofFlowDocument.ts";

type RangeResponse = Range | Range[];

interface LSPClientHandler {
  // Lifecycle Messages
  initialize(): Promise<m.InitializeResult>;
  initialized(): void;
  shutdown(): void;
  exit(): void;

  // Document Synchronization
  didOpen(pfDocument: ProofFlowDocument): void;
  didChange(pfDocument: ProofFlowDocument): void;
  didClose(): void;

  // Language Features
  // documentSymbol(params: m.DocumentSymbolParams): m.DocumentSymbol[] | m.SymbolInformation[] | null
  references(pos: Position): Promise<Range[] | null>;
  definition(pos: Position): Promise<RangeResponse | null>;
  typeDefinition(pos: Position): Promise<RangeResponse | null>;
  signatureHelp(pos: Position): Promise<m.SignatureHelp | null>;
  hover(pos: Position): Promise<m.Hover | null>;
  gotoDeclaration(pos: Position): Promise<RangeResponse | null>;
  completion(
    pos: Position,
    char: string,
  ): Promise<m.CompletionItem[] | m.CompletionList | null>;
}
