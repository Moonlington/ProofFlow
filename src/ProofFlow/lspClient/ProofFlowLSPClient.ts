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
} from "./models";

type LSPServerResponse<ResponseType> = {
  type: string;
  data: ResponseType;
};

enum ProofFlowLSPClientFileType {
  Coq = "coq",
  Lean = "lean",
}

export type diagnosticsHandler = (diag: DiagnosticsMessageData) => void;

class ProofFlowLSPClient implements LSPClientHandler {
  private wsUrl: string; // URL of the websocket

  private socket: WebSocket;

  private version = 0;

  private fileType: ProofFlowLSPClientFileType;

  private lspPath: string;

  private lastPfDocument?: ProofFlowDocument;

  constructor(
    wsUrl: string,
    fileType: ProofFlowLSPClientFileType,
    path: string,
  ) {
    this.wsUrl = wsUrl;
    this.fileType = fileType;
    this.lspPath = path;

    this.socket = new WebSocket(this.wsUrl);
    this.socket.addEventListener("open", () => {
      console.log("Connected to WebSocket server");
      this.socket.send(
        JSON.stringify({ type: "init", data: "Client initialized" }),
      );
    });

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
  setDiagnosticsHandler(handler: diagnosticsHandler): void {
    this.socket.addEventListener("message", (event) => {
      const message: DiagnosticsMessage = JSON.parse(event.data);
      if (message.type === "diagnostics") {
        console.log("Received diagnostics:", message.data);
        handler(message.data);
      }
    });
  }

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

  async expectNoResponse<ParamsType>(
    type: string,
    params: ParamsType,
  ): Promise<void> {
    await this.waitForOpenConnection();
    console.log("Message to LSP (no resp)", type, params);
    this.socket.send(JSON.stringify({ type: type, data: params }));
  }

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

  initialized(): void {
    this.expectNoResponse("initialized", {});
  }

  shutdown(): void {
    this.expectNoResponse("shutdown", {});
  }

  exit(): void {
    this.expectNoResponse("exit", {});
  }

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

    this.expectNoResponse("didOpen", params);
  }

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

    this.expectNoResponse("didChange", params);
  }

  didClose(pfDocument: ProofFlowDocument): void {
    let params: DidCloseTextDocumentParams = {
      textDocument: {
        uri: pfDocument.uri,
      },
    };

    this.lastPfDocument = pfDocument;

    this.expectNoResponse("didClose", params);
  }

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
