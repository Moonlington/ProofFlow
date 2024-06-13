import axios from 'axios';
import { ProofFlow } from './ProofFlow/editor/ProofFlow';
import { DiagnosticsMessage } from './lspMessageTypes';
import {CompletionContext, CompletionResult} from "@codemirror/autocomplete";
import {
  CompletionTriggerKind,
} from 'vscode-languageserver-protocol';

const socket = new WebSocket('ws://localhost:3000');

export class LSPMessenger {
  constructor(observerFunction: Function) {
    socket.addEventListener('open', () => {
      console.log('Connected to WebSocket server');
      // Example of sending a message to the server
      socket.send(JSON.stringify({ type: 'init', data: 'Client initialized' }));
    });
    
    socket.addEventListener('message', (event) => {
      const message: DiagnosticsMessage = JSON.parse(event.data);
      if (message.type === 'diagnostics') {
        console.log('Received diagnostics:', message.data);
        observerFunction(message.data);
      }
      // Add other message types as needed
    });
  }

  public async startServer(server: string): Promise<void> {
    console.log(server);
    try {
      const response = await axios.get('http://localhost:3000/start_server', {
        params: {
          server: server
        }
      });
      console.log('Server Response:', response.data);
    } catch (error) {
      console.error('Error starting server:', error);
    }
  }
  
  public async initializeServer(filePath: string): Promise<void> {
    try {
      const response = await axios.get('http://localhost:3000/initialize_server', {
        params: {
          filePath: filePath
        }
      });
      console.log('Initialize Response:', response.data);
    } catch (error) {
      console.error('Error initializing server:', error);
    }
  }
  
  public async initialized(): Promise<void> {
    try {
      const response = await axios.get('http://localhost:3000/initialized');
      console.log('Initialized Response:', response.data);
    } catch (error) {
      console.error('Error during initialization:', error);
    }
  }
  
  public async shutdown(): Promise<void> {
    try {
      const response = await axios.get('http://localhost:3000/shutdown');
      console.log('Shutdown Response:', response.data);
    } catch (error) {
      console.error('Error during shutdown:', error);
    }
  }
  
  public async exit(): Promise<void> {
    try {
      const response = await axios.get('http://localhost:3000/exit');
      console.log('Exit Response:', response.data);
    } catch (error) {
      console.error('Error during exit:', error);
    }
  }
  
  public async didOpen(uri: string, languageId: string, text: string, version: string): Promise<void> {
    console.log(uri, languageId, text, version);
    try {
      const response = await axios.get('http://localhost:3000/didOpen', {
        params: {
          uri: uri,
          languageId: languageId,
          text: text,
          version: version
        }
      });
      console.log('DidOpen Response:', response.data);
    } catch (error) {
      console.error('Error opening document:', error);
    }
  }
  
  public async didChange(uri: string, el: number, ec: number, text: string): Promise<void> {
    try {
      const response = await axios.get('http://localhost:3000/didChange', {
        params: {
          uri: uri,
          el: el,
          ec: ec,
          text: text,
        }
      });
      console.log('DidChange Response:', response.data);
    } catch (error) {
      console.error('Error changing document:', error);
    }
  }
  
  public async didClose(uri: string): Promise<void> {
    try {
      const response = await axios.get('http://localhost:3000/didClose', {
        params: {
          uri: uri
        }
      });
      console.log('DidClose Response:', response.data);
    } catch (error) {
      console.error('Error closing document:', error);
    }
  }
  
  public async documentSymbol(uri: string): Promise<void> {
    try {
      const response = await axios.get('http://localhost:3000/documentSymbol', {
        params: {
          uri: uri
        }
      });
      console.log('DocumentSymbol Response:', response.data);
    } catch (error) {
      console.error('Error getting document symbols:', error);
    }
  }
  
  public async references(uri: string, line: number, character: number): Promise<void> {
    try {
      const response = await axios.get('http://localhost:3000/references', {
        params: {
          uri: uri,
          line: line,
          character: character
        }
      });
      console.log('References Response:', response.data);
    } catch (error) {
      console.error('Error getting references:', error);
    }
  }
  
  public async definition(uri: string, line: number, character: number): Promise<any> {
    try {
      const response = await axios.get('http://localhost:3000/definition', {
        params: {
          uri: uri,
          line: line,
          character: character
        }
      });
      console.log('Definition Response:', response.data);
    } catch (error) {
      console.error('Error getting definition:', error);
    }
  }
  
  public async typeDefinition(uri: string, line: number, character: number): Promise<void> {
    try {
      const response = await axios.get('http://localhost:3000/typeDefinition', {
        params: {
          uri: uri,
          line: line,
          character: character
        }
      });
      console.log('TypeDefinition Response:', response.data);
    } catch (error) {
      console.error('Error getting type definition:', error);
    }
  }
  
  public async signatureHelp(uri: string, line: number, character: number): Promise<void> {
    try {
      const response = await axios.get('http://localhost:3000/signatureHelp', {
        params: {
          uri: uri,
          line: line,
          character: character
        }
      });
      console.log('SignatureHelp Response:', response.data);
    } catch (error) {
      console.error('Error getting signature help:', error);
    }
  }
  
  public async hover(uri: string, line: number, character: number): Promise<any> {
    try {
      const response = await axios.get('http://localhost:3000/hover', {
        params: {
          uri: uri,
          line: line,
          character: character
        }
      });
      console.log('Hover Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting hover:', error);
      return null;
    }
  }
  
  public async gotoDeclaration(uri: string, line: number, character: number): Promise<void> {
    try {
      const response = await axios.get('http://localhost:3000/gotoDeclaration', {
        params: {
          uri: uri,
          line: line,
          character: character
        }
      });
      console.log('GotoDeclaration Response:', response.data);
    } catch (error) {
      console.error('Error going to declaration:', error);
    }
  }

  //@ts-ignore
  public async requestCompletion(uri: string,
                                  context: CompletionContext,
                                  {line, character}: { line: number; character: number; },
                                  {
                                    triggerKind,
                                    triggerCharacter,
                                  }: {
                                    triggerKind: CompletionTriggerKind;
                                    triggerCharacter: string | undefined;
                                  }): Promise<any> {

    try {
      const response = await axios.get('http://localhost:3000/completion', {
        params: {
          uri: uri,
          line: line,
          character: character,
          triggerKind: triggerKind,
          triggerCharacter: triggerCharacter
        }
      });
      console.log('Completion response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error requesting completion:', error);
      return [];
    }
  }
}
