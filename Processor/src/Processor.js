const { validateCliArgs } = require('./config/cliValidator');
const { loadConfig } = require('./config/configLoader');
const { initLogger, logInfo, displayError } = require('./logging/logger');
const { initRedis, closeRedis } = require('./storage/redisClient');
const stateManager = require('./state/stateManager');
const sequenceManager = require('./state/sequenceManager');
const socketIoServer = require('./publishers/socketIoServer');
const { connectRelayClient, disconnectRelayClient } = require('./clients/receiverRelayClient');
const { connectRetransClient, disconnectRetransClient, requestRetransmission } = require('./clients/receiverRetransClient');
const queueProcessor = require('./queues/queueProcessor');

let snapshotTimer = null;

async function shutdown(code = 0) {
  logInfo('Initiating graceful shutdown...');

  if (snapshotTimer) clearInterval(snapshotTimer);

  await stateManager.persistSnapshot();

  disconnectRelayClient();
  disconnectRetransClient();
  socketIoServer.stopSocketIoServer();

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

async function main() {
  try {
    // 1. Validate CLI parameters
    const args = process.argv.slice(2);
    const cliParams = validateCliArgs(args);

    // 2. Load config
    const config = loadConfig();

    // 3. Init Logger
    initLogger(config.runtime.logFolder, cliParams.initials, cliParams.displayOn);
    logInfo('Processor Application starting', { cliParams });

    // 4. Init Redis
    initRedis(config.redis);

    // 5. Init State and Sequence Managers
    await stateManager.initializeState(cliParams.startY);
    await sequenceManager.initSequenceManager(cliParams.startY, cliParams.retransOn);

    // 6. Hook up retransmission callbacks
    queueProcessor.setRetransmissionCallback(requestRetransmission);

    // 7. Start Publishers (Socket.IO)
    socketIoServer.startSocketIoServer(config.servers.socketIoPort);

    // 8. Start Snapshot Timer
    const snapshotIntervalMs = config.runtime.snapshotIntervalMs || 5000;
    snapshotTimer = setInterval(async () => {
      await stateManager.persistSnapshot();
    }, snapshotIntervalMs);

    // 9. Connect Clients
    connectRetransClient(config); // Connect retrans first just in case
    setTimeout(() => {
       connectRelayClient(config);
    }, 500);

  } catch (err) {
    displayError(`Failed to start application: ${err.message}`);
    process.exit(1);
  }
}

main();
