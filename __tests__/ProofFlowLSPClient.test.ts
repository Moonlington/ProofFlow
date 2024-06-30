import { ProofFlowLSPClient, ProofFlowLSPClientFileType } from '../src/ProofFlow/lspClient/ProofFlowLSPClient';
import { jest } from '@jest/globals';
const WebSocket = require('ws');

describe('ProofFlowLSPClient', () => {
  let mockWebSocket: any;
  let client: ProofFlowLSPClient;

  beforeEach(() => {
    mockWebSocket = {
      send: jest.fn(),
      addEventListener: jest.fn((event: any, callback: any) => {
        if (event === 'open') {
            setTimeout(callback as () => void, 0);
        }
      }),
      readyState: WebSocket.OPEN,
    };
    global.WebSocket = jest.fn(() => mockWebSocket) as any;

    client = new ProofFlowLSPClient('ws://test', ProofFlowLSPClientFileType.Coq, '/path/to/lsp');
  });

  test('constructor initializes and sends init message', () => {
    console.log(mockWebSocket.send);
    expect(global.WebSocket).toHaveBeenCalledWith('ws://test');
    expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify({ type: 'init', data: 'Client initialized' }));
  }, 100000);

  test('waitForOpenConnection resolves when connection is open', async () => {
    await expect(client.waitForOpenConnection()).resolves.toBeUndefined();
  }, 100000);

  test('waitForResponse sends message and waits for response', async () => {
    const testMessage = { type: 'test', data: 'data' };
    mockWebSocket.addEventListener.mockImplementationOnce((event: any, callback: any) => {
      if (event === 'message') {
        setTimeout(() => callback({ data: JSON.stringify({ type: 'test', data: 'response' }) }), 100);
      }
    }, 100000);

    const response = await client.waitForResponse('test', 'data');
    expect(response).toEqual('response');
    expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(testMessage));
  });

  test('initialize sends startServer and initialize messages', async () => {
    mockWebSocket.addEventListener.mockImplementationOnce((event: any, callback: any) => {
        console.log("EVENT:");
        console.log(event);
      if (event === 'message') {
        setTimeout(() => callback({ data: JSON.stringify({ type: 'initialize', data: {} }) }), 100);
      }
    }, 100000);

    const result = await client.initialize();
    expect(result).toEqual({});
    expect(mockWebSocket.send).toHaveBeenCalledWith(expect.stringContaining('startServer'));
    expect(mockWebSocket.send).toHaveBeenCalledWith(expect.stringContaining('initialize'));
  });
});