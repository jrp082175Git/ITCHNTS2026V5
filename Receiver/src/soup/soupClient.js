const net = require('net');
const SoupStreamFramer = require('./soupStreamFramer');
const SoupSessionManager = require('./soupSessionManager');
const { buildLoginRequest } = require('./soupPacketBuilder');
const { startHeartbeat, stopHeartbeat, updateLastSent } = require('../runtime/heartbeatManager');
const stateManager = require('../runtime/stateManager');
const { logInfo, logError } = require('../logging/logger');
const { scheduleReconnect, resetReconnect } = require('../runtime/reconnectManager');

let currentSocket = null;
let framer = null;
let sessionManager = null;
let packetQueue = [];
let isProcessingQueue = false;

async function processQueue() {
  if (isProcessingQueue) return;
  isProcessingQueue = true;

  while (packetQueue.length > 0) {
    const fullPacket = packetQueue.shift();
    try {
      await sessionManager.handlePacket(fullPacket);

      const state = stateManager.getState();
      // Look at the latest added json
      const lastIdx = state.packetJSON.length > 0 ? (state.head === 0 ? state.maxSize - 1 : state.head - 1) : -1;
      let lastJSON = null;
      if (lastIdx !== -1) {
          lastJSON = state.packetJSON[lastIdx];
      }

      if (lastJSON && lastJSON.packetType === 'J') {
        disconnectSoupClient();
        logError('Login Rejected, stopping reconnect attempts.');
        break; // Stop processing further packets
      }
    } catch (err) {
      logError('Error processing packet from queue', { error: err.message });
    }
  }

  isProcessingQueue = false;
}

function connectSoupClient(config, itchParser, socketIoServer, relayTcpServer) {
  const { host, port, username, password } = config.itch;
  const state = stateManager.getState();

  framer = new SoupStreamFramer();
  sessionManager = new SoupSessionManager(itchParser, socketIoServer, relayTcpServer);

  stateManager.setConnectionStatus(`Connecting to ${host}:${port}...`);
  logInfo(`Connecting to SoupBinTCP at ${host}:${port}`);
  currentSocket = new net.Socket();

  currentSocket.connect(port, host, () => {
    stateManager.setConnectionStatus('Connected. Sending Login Request...');
    logInfo('Connected to SoupBinTCP server');
    resetReconnect();

    // Send Login Request immediately
    const reqSession = state.sessionId || '';
    const reqSeq = state.currentSequenceNo || 1;

    const loginPkt = buildLoginRequest(username, password, reqSession, reqSeq);
    currentSocket.write(loginPkt);
    updateLastSent();

    logInfo('Sent Login Request', { username, reqSession, reqSeq });

    startHeartbeat(currentSocket, config.runtime.heartbeatIntervalMs || 1000);
  });

  currentSocket.on('data', (chunk) => {
    framer.append(chunk);
  });

  framer.on('packet', (fullPacket) => {
    packetQueue.push(fullPacket);
    processQueue();
  });

  currentSocket.on('close', (hadError) => {
    stateManager.setConnectionStatus(`Disconnected${hadError ? ' (Error)' : ''}`);
    logInfo('SoupBinTCP socket closed', { hadError });
    stopHeartbeat();
    framer.clear();
    packetQueue = [];

    // Reconnect regardless of isLoggedIn, to handle initial connection drops
    stateManager.getState().isLoggedIn = false;
    scheduleReconnect(() => connectSoupClient(config, itchParser, socketIoServer, relayTcpServer));
  });

  currentSocket.on('error', (err) => {
    logError('SoupBinTCP socket error', { error: err.message });
  });
}

function disconnectSoupClient() {
  if (currentSocket) {
    currentSocket.destroy();
    currentSocket = null;
  }
}

module.exports = {
  connectSoupClient,
  disconnectSoupClient
};
