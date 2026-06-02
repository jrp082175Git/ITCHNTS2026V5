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
      logInfo('Socket.IO client connected to Processor', { socketId: socket.id });

      socket.on('disconnect', () => {
        logInfo('Socket.IO client disconnected from Processor', { socketId: socket.id });
      });
    });

    logInfo(`Processor Socket.IO server started on port ${port}`);
    return io;
  } catch (err) {
    logError('Error starting Processor Socket.IO server', { error: err.message });
    return null;
  }
}

function publish(event, data) {
  if (io) {
    io.emit(event, data);
  }
}

function stopSocketIoServer() {
  if (io) {
    io.close();
  }
}

module.exports = {
  startSocketIoServer,
  publish,
  stopSocketIoServer
};
