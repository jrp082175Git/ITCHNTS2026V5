const { logInfo, logError } = require('../logging/logger');
const { closeRedis } = require('../storage/redisClient');

let handlers = [];

function registerShutdownHandler(handler) {
  handlers.push(handler);
}

async function shutdown(code = 0) {
  logInfo('Initiating graceful shutdown...');

  for (const handler of handlers) {
    try {
      await handler();
    } catch (err) {
      logError('Error in shutdown handler', { error: err.message });
    }
  }

  try {
    await closeRedis();
  } catch (err) {
    logError('Error closing Redis', { error: err.message });
  }

  logInfo('Shutdown complete. Exiting.');
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

module.exports = {
  registerShutdownHandler,
  shutdown
};
