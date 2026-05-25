const { Server } = require('socket.io');
const { logInfo, logError } = require('../logging/logger');

let io = null;

function startSocketIoServer(port) {
  try {
    io = new Server(port, {
      cors: {
        origin: '*'
      }
    });

    io.on('connection', (socket) => {
      logInfo('Socket.IO client connected', { socketId: socket.id });

      socket.on('disconnect', () => {
        logInfo('Socket.IO client disconnected', { socketId: socket.id });
      });
    });

    logInfo(`Socket.IO server started on port ${port}`);
    return io;
  } catch (err) {
    logError('Error starting Socket.IO server', { error: err.message });
    return null;
  }
}

function emit(event, data) {
  if (io) {
    io.emit(event, data);
  }
}

function emitToClient(socketId, event, data) {
  if (io) {
    io.to(socketId).emit(event, data);
  }
}

function stopSocketIoServer() {
  if (io) {
    io.close();
  }
}

module.exports = {
  startSocketIoServer,
  emit,
  emitToClient,
  stopSocketIoServer
};
