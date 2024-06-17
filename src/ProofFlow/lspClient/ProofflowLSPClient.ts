export { ProofflowLSPClient, ProofflowLSPClientFileType };

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

enum ProofflowLSPClientFileType {
  Coq = "coq",
  Lean = "lean",
}

class ProofflowLSPClient implements LSPClientHandler {
  private uri: string; // uri of the document
  private wsUrl: string; // URL of the websocket

  private socket: WebSocket;

  private version = 0;

  private fileType: ProofflowLSPClientFileType;

  constructor(
    uri: string,
    wsUrl: string,
    diagnosticsFunc: (diag: DiagnosticsMessageData) => void,
    fileType: ProofflowLSPClientFileType,
  ) {
    this.uri = uri;
    this.wsUrl = wsUrl;
    this.fileType = fileType;

    this.socket = new WebSocket(this.wsUrl);
    this.socket.addEventListener("open", () => {
      console.log("Connected to WebSocket server");
      this.socket.send(
        JSON.stringify({ type: "init", data: "Client initialized" }),
      );
    });

    this.socket.addEventListener("message", (event) => {
      const message: DiagnosticsMessage = JSON.parse(event.data);
      if (message.type === "diagnostics") {
        console.log("Received diagnostics:", message.data);
        diagnosticsFunc(message.data);
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
          resolve(message.data);
        }
        this.socket.removeEventListener("message", waitForResponse);
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
        uri: this.uri,
        languageId: this.fileType,
        version: this.version++,
        text: pfDocument.toString(),
      },
    };

    this.expectNoResponse("didOpen", params);
  }

  didChange(pfDocument: ProofFlowDocument): void {
    let params: DidChangeTextDocumentParams = {
      textDocument: {
        uri: this.uri,
        version: this.version++,
      },
      contentChanges: [
        {
          text: pfDocument.toString(),
        },
      ],
    };

    this.expectNoResponse("didChange", params);
  }

  didClose(): void {
    let params: DidCloseTextDocumentParams = {
      textDocument: {
        uri: this.uri,
      },
    };

    this.expectNoResponse("didClose", params);
  }

  async references(pos: Position): Promise<Range[] | null> {
    let params: ReferenceParams = {
      textDocument: {
        uri: this.uri,
      },
      position: pos,
      context: {
        includeDeclaration: true,
      },
    };

    return this.waitForResponse("references", params);
  }

  async definition(pos: Position): Promise<(Range | Range[]) | null> {
    let params: DefinitionParams = {
      textDocument: {
        uri: this.uri,
      },
      position: pos,
    };

    return this.waitForResponse("definition", params);
  }

  async typeDefinition(pos: Position): Promise<(Range | Range[]) | null> {
    let params: TypeDefinitionParams = {
      textDocument: {
        uri: this.uri,
      },
      position: pos,
    };

    return this.waitForResponse("typeDefinition", params);
  }

  async signatureHelp(pos: Position): Promise<SignatureHelp | null> {
    let params: SignatureHelpParams = {
      textDocument: {
        uri: this.uri,
      },
      position: pos,
      context: {
        triggerKind: SignatureHelpTriggerKind.Invoked,
        isRetrigger: false,
      },
    };

    return this.waitForResponse("signatureHelp", params);
  }

  async hover(pos: Position): Promise<Hover | null> {
    let params: HoverParams = {
      textDocument: {
        uri: this.uri,
      },
      position: pos,
    };

    return this.waitForResponse("hover", params);
  }

  async gotoDeclaration(pos: Position): Promise<(Range | Range[]) | null> {
    let params: DeclarationParams = {
      textDocument: {
        uri: this.uri,
      },
      position: pos,
    };

    return this.waitForResponse("declaration", params);
  }

  async completion(
    pos: Position,
    char: string,
  ): Promise<CompletionList | CompletionItem[] | null> {
    let params: CompletionParams = {
      textDocument: {
        uri: this.uri,
      },
      position: pos,
      context: {
        triggerKind: CompletionTriggerKind.TriggerCharacter,
        triggerCharacter: char,
      },
    };

    return this.waitForResponse("completion", params);
  }
}
