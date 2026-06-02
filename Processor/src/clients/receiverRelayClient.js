const net = require('net');
const onReceiveQueue = require('../queues/onReceiveQueue');
const queueProcessor = require('../queues/queueProcessor');
const { logInfo, logError, logWarn } = require('../logging/logger');
const stateManager = require('../state/stateManager');

let client = null;
let reconnectTimer = null;

function connectRelayClient(config) {
  const { relayHost, relayPort } = config.receiver;

  client = new net.Socket();
  let buffer = '';

  client.connect(relayPort, relayHost, () => {
    logInfo(`Connected to Receiver Relay Server at ${relayHost}:${relayPort}`);
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }
  });

  client.on('data', (data) => {
    buffer += data.toString('utf8');
    const parts = buffer.split('\n');
    buffer = parts.pop();

    for (const part of parts) {
      if (!part.trim()) continue;

      try {
        const msg = JSON.parse(part);

        // 24x7 Reset check: Receiver broadcasts this
        if (msg.type === 'systemReset' && msg.reason === '24x7 Reset') {
          logInfo('Received 24x7 system reset signal from Receiver Relay.');
          stateManager.resetState();
          onReceiveQueue.clear();
          continue;
        }

        // Only process sequenced messages via the queue
        if (msg.sequenceNo !== undefined) {
          onReceiveQueue.push(msg);
          queueProcessor.processQueues();
        } else if (msg.packetType === 'R') {
            // Heartbeat
        }

      } catch (err) {
        logError('Error parsing message from relay', { error: err.message, payload: part });
      }
    }
  });

  client.on('close', () => {
    logWarn('Disconnected from Receiver Relay Server. Reconnecting...');
    scheduleReconnect(config);
  });

  client.on('error', (err) => {
    logError('Relay Client Error', { error: err.message });
  });
}

function scheduleReconnect(config) {
  if (!reconnectTimer) {
    reconnectTimer = setTimeout(() => {
      connectRelayClient(config);
    }, config.runtime.reconnectIntervalMs || 1000);
  }
}

function disconnectRelayClient() {
  if (client) {
    client.destroy();
    client = null;
  }
}

module.exports = {
  connectRelayClient,
  disconnectRelayClient
};
