const net = require('net');
const { logInfo, logError } = require('../logging/logger');

let server = null;
const clients = new Set();

function startRelayTcpServer(port) {
  server = net.createServer((socket) => {
    logInfo('TCP Relay client connected', { remoteAddress: socket.remoteAddress });
    clients.add(socket);

    socket.on('error', (err) => {
      logError('TCP Relay client error', { error: err.message, remoteAddress: socket.remoteAddress });
    });

    socket.on('close', () => {
      logInfo('TCP Relay client disconnected', { remoteAddress: socket.remoteAddress });
      clients.delete(socket);
    });
  });

  server.on('error', (err) => {
    logError('TCP Relay server error', { error: err.message });
  });

  server.listen(port, () => {
    logInfo(`TCP Relay server started on port ${port}`);
  });

  return server;
}

function broadcastMessage(messageJSON) {
  if (clients.size === 0) return;

  const dataStr = JSON.stringify(messageJSON) + '\n';
  const dataBuf = Buffer.from(dataStr, 'utf8');

  for (const socket of clients) {
    if (!socket.writable) continue;

    // Backpressure handling: if queue is too large, drop client or skip
    if (socket.writableLength > 1024 * 1024) { // 1MB buffer limit
      logError('TCP Relay client buffer full, dropping connection', { remoteAddress: socket.remoteAddress });
      socket.destroy();
      clients.delete(socket);
      continue;
    }

    socket.write(dataBuf);
  }
}

function stopRelayTcpServer() {
  for (const socket of clients) {
    socket.destroy();
  }
  clients.clear();

  if (server) {
    server.close();
  }
}

module.exports = {
  startRelayTcpServer,
  broadcastMessage,
  stopRelayTcpServer
};
