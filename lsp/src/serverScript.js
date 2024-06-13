import { LspClient } from './lspClient';
import express from 'express';
import { spawn } from 'child_process';
import { JSONRPCEndpoint } from './jsonRpcEndpoint';

const app = express();
const endpoint = new JSONRPCEndpoint(process.stdin, process.stdout);
const lspClient = new LspClient(endpoint);


// Define a route to execute the server-side script
app.get('/start_server', (req, res) => {
  const process = spawn('coq-lsp', {
    shell: true,
    stdio: 'pipe',
  });

  let output = '';

  process.stdout.on('data', (data) => {
    output += data;
  });

  process.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  process.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
    res.send(output + req.query); // Send the output back to the client
  });
});

// app.get('/stop_server', (req, res) => {
//     //TODO: Implement stop server
// });

app.get('/initialize', (req, res) => {
  const stupid = req.query;
  const params = {
    processId: process.pid, // Replace with the actual process ID
    rootUri: 'file://C:/School/SEP/LSP practice/COQ/out/Test.v', // Replace with the actual root URI
    capabilities: {} // Replace with the actual capabilities
  };
  lspClient.initialize(params);
  res.send('Initialization request sent.' + stupid);
});

// app.get('/initialized', (req, res) => {

// });

// app.get('/shutdown', (req, res) => {

// });

// app.get('/exit', (req, res) => {

// });

// app.get('/didOpen', (req, res) => {

// });

// app.get('/didClose', (req, res) => {

// });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
