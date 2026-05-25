const net = require('net');
const { logInfo, logError } = require('../logging/logger');
const { getMessagesBySequenceRange } = require('../storage/redisRepository');
const socketIoServer = require('./socketIoServer');

let server = null;

function startRetransmissionTcpServer(port) {
  server = net.createServer((socket) => {
    logInfo('Retransmission TCP client connected', { remoteAddress: socket.remoteAddress });

    let buffer = '';

    socket.on('data', async (chunk) => {
      buffer += chunk.toString('utf8');

      const parts = buffer.split('\n');
      buffer = parts.pop(); // keep remainder

      for (const part of parts) {
        if (!part.trim()) continue;

        try {
          const req = JSON.parse(part);
          await handleRetransmissionRequest(socket, req);
        } catch (err) {
          logError('Invalid retransmission request format', { error: err.message, payload: part });
          socket.write(JSON.stringify({ error: 'Invalid JSON format' }) + '\n');
        }
      }
    });

    socket.on('error', (err) => {
      logError('Retransmission TCP client error', { error: err.message });
    });

    socket.on('close', () => {
      logInfo('Retransmission TCP client disconnected', { remoteAddress: socket.remoteAddress });
    });
  });

  server.on('error', (err) => {
    logError('Retransmission TCP server error', { error: err.message });
  });

  server.listen(port, () => {
    logInfo(`Retransmission TCP server started on port ${port}`);
  });

  return server;
}

async function handleRetransmissionRequest(socket, req) {
  const { socketID, beginningSequence, endingSequence } = req;

  if (!socketID) {
    socket.write(JSON.stringify({ error: 'Missing socketID' }) + '\n');
    return;
  }

  const beginSeq = parseInt(beginningSequence, 10);
  const endSeq = parseInt(endingSequence, 10);

  if (isNaN(beginSeq) || isNaN(endSeq) || beginSeq <= 0 || endSeq <= 0 || beginSeq > endSeq) {
    socket.write(JSON.stringify({ error: 'Invalid sequence range' }) + '\n');
    return;
  }

  // Prevent excessive requests
  const MAX_RANGE = 10000;
  if (endSeq - beginSeq > MAX_RANGE) {
    socket.write(JSON.stringify({ error: `Range exceeds max limit of ${MAX_RANGE}` }) + '\n');
    return;
  }

  logInfo('Processing retransmission request', { socketID, beginSeq, endSeq });

  const messages = await getMessagesBySequenceRange(beginSeq, endSeq);

  const responseObj = {
    type: 'retransmissionResponse',
    socketID,
    range: { beginSeq, endSeq },
    messagesCount: messages.length,
    messages
  };

  const responseJson = JSON.stringify(responseObj) + '\n';

  // Send back via TCP
  if (socket.writable) {
    socket.write(responseJson);
  }

  // Send to specific Socket.IO client
  socketIoServer.emitToClient(socketID, 'retransmissionResponse', responseObj);
}

function stopRetransmissionTcpServer() {
  if (server) {
    server.close();
  }
}

module.exports = {
  startRetransmissionTcpServer,
  stopRetransmissionTcpServer
};
