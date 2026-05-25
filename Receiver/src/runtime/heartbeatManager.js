const { logInfo, logError } = require('../logging/logger');
const { buildClientHeartbeat } = require('../soup/soupPacketBuilder');

let heartbeatTimer = null;
let lastSentTime = Date.now();
let lastReceivedTime = Date.now();

function startHeartbeat(clientSocket, intervalMs) {
  stopHeartbeat();
  logInfo('Starting heartbeat manager', { intervalMs });

  heartbeatTimer = setInterval(() => {
    const now = Date.now();
    if (now - lastSentTime >= intervalMs) {
      try {
        const hbPacket = buildClientHeartbeat();
        clientSocket.write(hbPacket);
        lastSentTime = now;
      } catch (err) {
        logError('Failed to send client heartbeat', { error: err.message });
      }
    }

    if (now - lastReceivedTime > intervalMs * 2) {
      // Depending on strictness, we could force reconnect here
      logError('No data received from server within heartbeat window');
    }
  }, intervalMs / 2);
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

function updateLastSent() {
  lastSentTime = Date.now();
}

function updateLastReceived() {
  lastReceivedTime = Date.now();
}

module.exports = {
  startHeartbeat,
  stopHeartbeat,
  updateLastSent,
  updateLastReceived
};
