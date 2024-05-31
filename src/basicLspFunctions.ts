import axios from 'axios';

const socket = new WebSocket('ws://localhost:3000');

interface DiagnosticsMessage {
  type: 'diagnostics';
  data: any; // Replace 'any' with a more specific type if you have one
}

socket.addEventListener('open', () => {
  console.log('Connected to WebSocket server');
  // Example of sending a message to the server
  socket.send(JSON.stringify({ type: 'init', data: 'Client initialized' }));
});

socket.addEventListener('message', (event) => {
  const message: DiagnosticsMessage = JSON.parse(event.data);
  if (message.type === 'diagnostics') {
    console.log('Received diagnostics:', message.data);
  }
  // Add other message types as needed
});

async function startServer(): Promise<void> {
  try {
    const response = await axios.get('http://localhost:3000/start_server', {
      params: {
        server: 'coq'
      }
    });
    console.log('Server Response:', response.data);
  } catch (error) {
    console.error('Error starting server:', error);
  }
}

async function initializeServer(filePath: string): Promise<void> {
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

async function initialized(): Promise<void> {
  try {
    const response = await axios.get('http://localhost:3000/initialized');
    console.log('Initialized Response:', response.data);
  } catch (error) {
    console.error('Error during initialization:', error);
  }
}

async function shutdown(): Promise<void> {
  try {
    const response = await axios.get('http://localhost:3000/shutdown');
    console.log('Shutdown Response:', response.data);
  } catch (error) {
    console.error('Error during shutdown:', error);
  }
}

async function exit(): Promise<void> {
  try {
    const response = await axios.get('http://localhost:3000/exit');
    console.log('Exit Response:', response.data);
  } catch (error) {
    console.error('Error during exit:', error);
  }
}

async function didOpen(uri: string, languageId: string, text: string, version: string): Promise<void> {
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

async function didClose(uri: string): Promise<void> {
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

async function documentSymbol(uri: string): Promise<void> {
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

async function references(uri: string, line: number, character: number): Promise<void> {
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

async function definition(uri: string, line: number, character: number): Promise<void> {
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

async function typeDefinition(uri: string, line: number, character: number): Promise<void> {
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

async function signatureHelp(uri: string, line: number, character: number): Promise<void> {
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

async function hover(uri: string, line: number, character: number): Promise<void> {
  try {
    const response = await axios.get('http://localhost:3000/hover', {
      params: {
        uri: uri,
        line: line,
        character: character
      }
    });
    console.log('Hover Response:', response.data);
  } catch (error) {
    console.error('Error getting hover:', error);
  }
}

async function gotoDeclaration(uri: string, line: number, character: number): Promise<void> {
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

export {
  startServer,
  initializeServer,
  initialized,
  shutdown,
  exit,
  didOpen,
  didClose,
  documentSymbol,
  references,
  definition,
  typeDefinition,
  signatureHelp,
  hover,
  gotoDeclaration
};
