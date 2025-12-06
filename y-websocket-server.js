// y-websocket-server.js (place at project root)
import http from 'http';
import WebSocket from 'ws';
import { setupWSConnection } from 'y-websocket/bin/utils.js';

const port = process.env.Y_WEBSOCKET_PORT || 1234;
const server = http.createServer();

const wss = new WebSocket.Server({ server });

wss.on('connection', (conn, req) => {
  // setupWSConnection handles the Yjs websocket protocol
  setupWSConnection(conn, req);
});

server.listen(port, () => {
  console.log(`y-websocket server running on ws://localhost:${port}`);
});