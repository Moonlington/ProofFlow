export { ProofFlowLSPClient, ProofFlowLSPClientFileType };

import {
  ProofFlowDocument,
  Position,
  Range,
} from "../editor/ProofFlowDocument";
import { LSPClientHandler } from "./lspClientHandler";
import {
  InitializeResult,
  SignatureHelp,
  Hover,
  CompletionList,
  CompletionItem,
  DiagnosticsMessage,
  DiagnosticsMessageData,
  InitializeParams,
  DidOpenTextDocumentParams,
  DidChangeTextDocumentParams,
  DidCloseTextDocumentParams,
  ReferenceParams,
  DefinitionParams,
  SignatureHelpTriggerKind,
  TypeDefinitionParams,
  SignatureHelpParams,
  HoverParams,
  DeclarationParams,
  CompletionParams,
  CompletionTriggerKind,
  DocumentProgressMessage,
} from "./models";

/**
 * The response from the LSP server
 */
type LSPServerResponse<ResponseType> = {
  type: string;
  data: ResponseType;
};

/**
 * The ProofFlow LSP clients to choose from
 */
enum ProofFlowLSPClientFileType {
  Coq = "coq",
  Lean = "lean",
}


export type diagnosticsHandler = (diag: DiagnosticsMessageData) => void; 
export type documentProgressHandler = () => void; 

/**
 * The ProofFlow LSP client
 */
class ProofFlowLSPClient implements LSPClientHandler {
  private wsUrl: string; // URL of the websocket

  private socket: WebSocket; // The websocket

  private version = 0; // The version of the document

  private fileType: ProofFlowLSPClientFileType; // The file type

  private lspPath: string; // The path to the LSP server

  private lastPfDocument?: ProofFlowDocument; // The last ProofFlow document

  constructor(
    wsUrl: string,
    fileType: ProofFlowLSPClientFileType,
    path: string,
  ) {
    this.wsUrl = wsUrl;
    this.fileType = fileType;
    this.lspPath = path;

    this.socket = new WebSocket(this.wsUrl);
    // Add event listeners
    // Event: When the connection is opened
    this.socket.addEventListener("open", () => {
      console.log("Connected to WebSocket server");
      this.socket.send(
        JSON.stringify({ type: "init", data: "Client initialized" }),
      );
    });

    // Event: When there is no connection
    this.socket.addEventListener("message", async (event) => {
      const message: LSPServerResponse<string> = JSON.parse(event.data);
      if (message.type === "reconnect") {
        console.log("Received reconnect message");
        await this.initialize();
        this.initialized();
        if (this.lastPfDocument) this.didOpen(this.lastPfDocument);
      }
    });
  }

  // Set the diagnostics handler
  setDiagnosticsHandler(handler: diagnosticsHandler): void {
    this.socket.addEventListener("message", (event) => {
      const message: DiagnosticsMessage = JSON.parse(event.data);
      if (message.type === "diagnostics") {
        console.log("Received diagnostics:", message.data);
        handler(message.data);
      }
    });
  }

  // Set the document progress handler
  setDocumentProgressHandler(handler: documentProgressHandler): void {
    this.socket.addEventListener("message", (event) => {
      const message: DocumentProgressMessage = JSON.parse(event.data);
      if (message.type === "documentChecked") {
        console.log("Received document progress:", message.data);
        handler();
      }
    });
  }

  /**
   * Wait for the connection to open
   * @returns A promise that resolves when the connection is open
   */
  waitForOpenConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      const maxNumberOfAttempts = 25;
      let attempts = 0;
      const interval = setInterval(() => {
        if (attempts >= maxNumberOfAttempts) {
          clearInterval(interval);
          reject();
        } else if (this.socket.readyState === this.socket.OPEN) {
          clearInterval(interval);
          resolve();
        }
        attempts++;
      }, 500);
    });
  }

  /**
   * Wait for a response from the LSP server
   * @param type The type of the message
   * @param params The parameters of the message
   * @returns A promise that resolves with the response
   */
  async waitForResponse<ParamsType, ResultType>(
    type: string,
    params: ParamsType,
  ): Promise<ResultType> {
    await this.waitForOpenConnection();
    console.log("Message to LSP", type, params);
    return new Promise((resolve, reject) => {
      this.socket.send(JSON.stringify({ type: type, data: params }));
      let waitForResponse = (event: MessageEvent) => {
        const message: LSPServerResponse<ResultType> = JSON.parse(event.data);
        if (message.type === type) {
          console.log("Received message back", message);
          this.socket.removeEventListener("message", waitForResponse);
          resolve(message.data);
        }
      };
      this.socket.addEventListener("message", waitForResponse);
      setTimeout(() => {
        this.socket.removeEventListener("message", waitForResponse);
        reject();
      }, 20000);
    });
  }

  /**
   * Expect no response from the LSP server
   * @param type The type of the message
   * @param params The parameters of the message
   */
  async expectNoResponse<ParamsType>(
    type: string,
    params: ParamsType,
  ): Promise<void> {
    await this.waitForOpenConnection();
    console.log("Message to LSP (no resp)", type, params);
    this.socket.send(JSON.stringify({ type: type, data: params }));
  }

  /**
   * Initialize the LSP server
   * @returns A promise that resolves with the initialization result
   */
  async initialize(): Promise<InitializeResult> {
    let startParams = {
      server: this.fileType,
      path: this.lspPath,
    };

    await this.waitForResponse("startServer", startParams);

    let params: InitializeParams = {
      processId: null,
      capabilities: {},
      clientInfo: {
        name: "ProofflowLSPClient",
      },
      rootUri: null,
    };

    return this.waitForResponse("initialize", params);
  }

  /**
   * Send the initialized message to the LSP server
   */
  initialized(): void {
    this.expectNoResponse("initialized", {});
  }

  /**
   * Shutdown the LSP server
   */
  shutdown(): void {
    this.expectNoResponse("shutdown", {});
  }

  /**
   * Exit the LSP server
   */
  exit(): void {
    this.expectNoResponse("exit", {});
  }

  /**
   * A document has been opened
   * @param pfDocument The ProofFlow document
   */
  didOpen(pfDocument: ProofFlowDocument): void {
    let params: DidOpenTextDocumentParams = {
      textDocument: {
        uri: pfDocument.uri,
        languageId: this.fileType,
        version: this.version++,
        text: pfDocument.toString(),
      },
    };

    this.lastPfDocument = pfDocument;
    pfDocument.documentProgressed = false;
    this.expectNoResponse("didOpen", params);
  }

  /**
   * A change to the document has been made
   * @param pfDocument The ProofFlow document
   */
  didChange(pfDocument: ProofFlowDocument): void {
    let params: DidChangeTextDocumentParams = {
      textDocument: {
        uri: pfDocument.uri,
        version: this.version++,
      },
      contentChanges: [
        {
          text: pfDocument.toString(),
        },
      ],
    };

    this.lastPfDocument = pfDocument;
    pfDocument.documentProgressed = false;
    this.expectNoResponse("didChange", params);
  }

  /**
   * The document has been closed
   * @param pfDocument The ProofFlow document
   */
  didClose(pfDocument: ProofFlowDocument): void {
    let params: DidCloseTextDocumentParams = {
      textDocument: {
        uri: pfDocument.uri,
      },
    };

    this.lastPfDocument = pfDocument;

    this.expectNoResponse("didClose", params);
  }

  /**
   * Get references to a symbol
   * @param pfDocument The ProofFlow document
   * @param pos The position of the symbol
   * @returns A promise that resolves with the references
   */
  async references(
    pfDocument: ProofFlowDocument,
    pos: Position,
  ): Promise<Range[] | null> {
    let params: ReferenceParams = {
      textDocument: {
        uri: pfDocument.uri,
      },
      position: pos,
      context: {
        includeDeclaration: true,
      },
    };

    this.lastPfDocument = pfDocument;

    return this.waitForResponse("references", params);
  }

  /**
   * Get the definition of a symbol
   * @param pfDocument The ProofFlow document
   * @param pos The position of the symbol
   * @returns A promise that resolves with the definition
   */
  async definition(
    pfDocument: ProofFlowDocument,
    pos: Position,
  ): Promise<(Range | Range[]) | null> {
    let params: DefinitionParams = {
      textDocument: {
        uri: pfDocument.uri,
      },
      position: pos,
    };

    this.lastPfDocument = pfDocument;

    return this.waitForResponse("definition", params);
  }

  /**
   * Get the type definition of a symbol
   * @param pfDocument The ProofFlow document
   * @param pos The position of the symbol
   * @returns A promise that resolves with the type definition
   */
  async typeDefinition(
    pfDocument: ProofFlowDocument,
    pos: Position,
  ): Promise<(Range | Range[]) | null> {
    let params: TypeDefinitionParams = {
      textDocument: {
        uri: pfDocument.uri,
      },
      position: pos,
    };

    this.lastPfDocument = pfDocument;

    return this.waitForResponse("typeDefinition", params);
  }

  /**
   * Get the signature help for a symbol
   * @param pfDocument The ProofFlow document
   * @param pos The position of the symbol
   * @returns A promise that resolves with the signature help
   */
  async signatureHelp(
    pfDocument: ProofFlowDocument,
    pos: Position,
  ): Promise<SignatureHelp | null> {
    let params: SignatureHelpParams = {
      textDocument: {
        uri: pfDocument.uri,
      },
      position: pos,
      context: {
        triggerKind: SignatureHelpTriggerKind.Invoked,
        isRetrigger: false,
      },
    };

    this.lastPfDocument = pfDocument;

    return this.waitForResponse("signatureHelp", params);
  }

  /**
   * Get the hover information for a symbol
   * @param pfDocument The ProofFlow document
   * @param pos The position of the symbol
   * @returns A promise that resolves with the hover information
   */
  async hover(
    pfDocument: ProofFlowDocument,
    pos: Position,
  ): Promise<Hover | null> {
    let params: HoverParams = {
      textDocument: {
        uri: pfDocument.uri,
      },
      position: pos,
    };

    this.lastPfDocument = pfDocument;

    return this.waitForResponse("hover", params);
  }

  /**
   * Go to the declaration of a symbol
   * @param pfDocument The ProofFlow document
   * @param pos The position of the symbol
   * @returns A promise that resolves with the declaration
   */
  async gotoDeclaration(
    pfDocument: ProofFlowDocument,
    pos: Position,
  ): Promise<(Range | Range[]) | null> {
    let params: DeclarationParams = {
      textDocument: {
        uri: pfDocument.uri,
      },
      position: pos,
    };

    this.lastPfDocument = pfDocument;

    return this.waitForResponse("declaration", params);
  }

  /**
   * Get the completions for a symbol
   * @param pfDocument The ProofFlow document
   * @param pos The position of the symbol
   * @param char The character that triggered the completion
   * @returns A promise that resolves with the completions
   */
  async completion(
    pfDocument: ProofFlowDocument,
    pos: Position,
    char: string,
  ): Promise<CompletionList | CompletionItem[] | null> {
    let params: CompletionParams = {
      textDocument: {
        uri: pfDocument.uri,
      },
      position: pos,
      context: {
        triggerKind: CompletionTriggerKind.TriggerCharacter,
        triggerCharacter: char,
      },
    };

    this.lastPfDocument = pfDocument;

    return this.waitForResponse("completion", params);
  }
}
