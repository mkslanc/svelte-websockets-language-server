const WebSocket = require('ws');
const {spawn} = require('child_process');
const { StreamMessageReader, StreamMessageWriter } = require('vscode-jsonrpc');

const wss = new WebSocket.Server({port: 3030});

wss.on('connection', ws => {
    const serverProcess = spawn('node', [require.resolve('svelte-language-server/bin/server.js'), "--stdio"]);

    const reader = new StreamMessageReader(serverProcess.stdout);
    const writer = new StreamMessageWriter(serverProcess.stdin);

    reader.listen(message => {
        ws.send(JSON.stringify(message));
    });

    ws.on('message', message => {
        let parsed = JSON.parse(message);
        if (parsed.method && parsed.method === "initialize") {
            parsed.params.rootUri = __dirname
        }
        writer.write(parsed);
    });

    serverProcess.stderr.on('data', data => {
        console.error(`svelte-ls error: ${data}`);
    });

    serverProcess.on('exit', code => {
        console.log(`svelte-ls exited with code ${code}`);
    });

    serverProcess.on('error', err => {
        console.error('Failed to start svelte-ls:', err);
    });
});
