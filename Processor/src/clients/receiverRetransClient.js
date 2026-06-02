const net = require('net');
const onCacheQueue = require('../queues/onCacheQueue');
const queueProcessor = require('../queues/queueProcessor');
const { logInfo, logError, logWarn } = require('../logging/logger');

let client = null;
let reconnectTimer = null;
let currentConfig = null;

function connectRetransClient(config) {
  currentConfig = config;
  const { retransHost, retransPort } = config.receiver;

  client = new net.Socket();
  let buffer = '';

  client.connect(retransPort, retransHost, () => {
    logInfo(`Connected to Receiver Retransmission Server at ${retransHost}:${retransPort}`);
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
        const response = JSON.parse(part);

        if (response.error) {
          logError('Retransmission Error from Server', { error: response.error });
          queueProcessor.resumeLiveProcessing(); // Resume to avoid complete hang, or handle otherwise
          return;
        }

        if (response.type === 'retransmissionResponse' && response.messages) {
          logInfo(`Received ${response.messages.length} retransmitted messages`);

          for (const msg of response.messages) {
            onCacheQueue.push(msg);
          }

          queueProcessor.resumeLiveProcessing();
        }
      } catch (err) {
        logError('Error parsing retransmission response', { error: err.message });
      }
    }
  });

  client.on('close', () => {
    logWarn('Disconnected from Receiver Retransmission Server. Reconnecting...');
    scheduleReconnect(config);
  });

  client.on('error', (err) => {
    logError('Retransmission Client Error', { error: err.message });
  });
}

function requestRetransmission(beginningSequence, endingSequence) {
  if (!client || !client.writable) {
    logError('Cannot send retransmission request, socket not connected.');
    return;
  }

  const maxRange = currentConfig.runtime.maxRetransmissionRange || 10000;
  if (endingSequence - beginningSequence > maxRange) {
     logError('Requested retransmission range exceeds max limits.', { beginningSequence, endingSequence, maxRange });
     endingSequence = beginningSequence + maxRange; // Cap it
  }

  const req = {
    socketID: `processor_${process.pid}`,
    beginningSequence,
    endingSequence
  };

  logInfo(`Requesting retransmission for sequence ${beginningSequence} to ${endingSequence}`);
  client.write(JSON.stringify(req) + '\n');
}

function scheduleReconnect(config) {
  if (!reconnectTimer) {
    reconnectTimer = setTimeout(() => {
      connectRetransClient(config);
    }, config.runtime.reconnectIntervalMs || 1000);
  }
}

function disconnectRetransClient() {
  if (client) {
    client.destroy();
    client = null;
  }
}

module.exports = {
  connectRetransClient,
  disconnectRetransClient,
  requestRetransmission
};
