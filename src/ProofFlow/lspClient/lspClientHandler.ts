import {
  Position,
  ProofFlowDocument,
  Range,
} from "../editor/ProofFlowDocument.ts";
import {
  diagnosticsHandler,
  documentProgressHandler,
} from "./ProofFlowLSPClient.ts";
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

  setDiagnosticsHandler(handler: diagnosticsHandler): void;
  setDocumentProgressHandler(handler: documentProgressHandler): void;

  // Document Synchronization
  didOpen(pfDocument: ProofFlowDocument): void;
  didChange(pfDocument: ProofFlowDocument): void;
  didClose(pfDocument: ProofFlowDocument): void;

  // Language Features
  // documentSymbol(params: DocumentSymbolParams): DocumentSymbol[] | SymbolInformation[] | null
  references(
    pfDocument: ProofFlowDocument,
    pos: Position,
  ): Promise<Range[] | null>;
  definition(
    pfDocument: ProofFlowDocument,
    pos: Position,
  ): Promise<RangeResponse | null>;
  typeDefinition(
    pfDocument: ProofFlowDocument,
    pos: Position,
  ): Promise<RangeResponse | null>;
  signatureHelp(
    pfDocument: ProofFlowDocument,
    pos: Position,
  ): Promise<SignatureHelp | null>;
  hover(pfDocument: ProofFlowDocument, pos: Position): Promise<Hover | null>;
  gotoDeclaration(
    pfDocument: ProofFlowDocument,
    pos: Position,
  ): Promise<RangeResponse | null>;
  completion(
    pfDocument: ProofFlowDocument,
    pos: Position,
    char: string,
  ): Promise<CompletionItem[] | CompletionList | null>;
}
