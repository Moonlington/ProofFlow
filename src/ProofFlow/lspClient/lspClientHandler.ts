import { ProofFlowDocument, Range } from "../editor/ProofFlowDocument.ts";
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
import { Position } from "../editor/ProofFlowPosition.ts";

type RangeResponse = Range | Range[];

/**
 * Interface for the LSP client handler, allows for handling LSP functions between the client and server.
 * Currently being used in the ProofFlowLSPClient.
 */

export interface LSPClientHandler {
  // Lifecycle Messages

  // To start the LSP server
  initialize(): Promise<InitializeResult>;
  // Report that initialization is done
  initialized(): void;

  // To stop the LSP server
  shutdown(): void;
  exit(): void;

  // Handlers for document diagnostics and current progress
  setDiagnosticsHandler(handler: diagnosticsHandler): void;
  setDocumentProgressHandler(handler: documentProgressHandler): void;

  // Document Synchronization
  didOpen(pfDocument: ProofFlowDocument): void;

  // Sending any file changes to the server
  didChange(pfDocument: ProofFlowDocument): void;
  didClose(pfDocument: ProofFlowDocument): void;

  // Language Specific Features
  // Called depending on the use cases within ProofFlow
  // documentSymbol(params: DocumentSymbolParams): DocumentSymbol[] | SymbolInformation[] | null
  references(
    pfDocument: ProofFlowDocument,
    pos: Position,
  ): Promise<Range[] | null>;

  // Function for the definition of a language syntax / element
  definition(
    pfDocument: ProofFlowDocument,
    pos: Position,
  ): Promise<RangeResponse | null>;

  // Function for getting explanation of certain language types
  typeDefinition(
    pfDocument: ProofFlowDocument,
    pos: Position,
  ): Promise<RangeResponse | null>;
  signatureHelp(
    pfDocument: ProofFlowDocument,
    pos: Position,
  ): Promise<SignatureHelp | null>;

  // Getting information on a syntax when hovering over it
  hover(pfDocument: ProofFlowDocument, pos: Position): Promise<Hover | null>;

  gotoDeclaration(
    pfDocument: ProofFlowDocument,
    pos: Position,
  ): Promise<RangeResponse | null>;

  // Function to call autocompletion of a syntax
  completion(
    pfDocument: ProofFlowDocument,
    pos: Position,
    char: string,
  ): Promise<CompletionItem[] | CompletionList | null>;
}
