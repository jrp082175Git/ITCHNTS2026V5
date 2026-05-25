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

function connectSoupClient(config, itchParser, socketIoServer, relayTcpServer) {
  const { host, port, username, password } = config.itch;
  const state = stateManager.getState();

  framer = new SoupStreamFramer();
  sessionManager = new SoupSessionManager(itchParser, socketIoServer, relayTcpServer);

  logInfo(`Connecting to SoupBinTCP at ${host}:${port}`);
  currentSocket = new net.Socket();

  currentSocket.connect(port, host, () => {
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

  framer.on('packet', async (fullPacket) => {
    await sessionManager.handlePacket(fullPacket);

    // Check if we got Login Rejected and need to disconnect
    const state = stateManager.getState();
    const lastJSON = state.packetJSON[state.packetJSON.length - 1];
    if (lastJSON && lastJSON.packetType === 'J') {
      disconnectSoupClient();
      logError('Login Rejected, stopping reconnect attempts.');
    }
  });

  currentSocket.on('close', (hadError) => {
    logInfo('SoupBinTCP socket closed', { hadError });
    stopHeartbeat();
    framer.clear();

    if (stateManager.getState().isLoggedIn) {
        stateManager.getState().isLoggedIn = false;
        scheduleReconnect(() => connectSoupClient(config, itchParser, socketIoServer, relayTcpServer));
    }
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
