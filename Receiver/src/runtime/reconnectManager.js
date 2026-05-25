const { logInfo, logError } = require('../logging/logger');

let reconnectAttempts = 0;
let baseDelayMs = 1000;
let maxDelayMs = 30000;
let reconnectTimer = null;

function initReconnectManager(config) {
  baseDelayMs = config.reconnectDelayBaseMs || 1000;
  maxDelayMs = config.reconnectMaxDelayMs || 30000;
}

function scheduleReconnect(connectFunc) {
  if (reconnectTimer) return;

  const delay = Math.min(baseDelayMs * Math.pow(2, reconnectAttempts), maxDelayMs);
  reconnectAttempts++;

  logInfo(`Scheduling reconnect attempt ${reconnectAttempts} in ${delay}ms`);

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectFunc();
  }, delay);
}

function resetReconnect() {
  reconnectAttempts = 0;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

module.exports = {
  initReconnectManager,
  scheduleReconnect,
  resetReconnect
};
