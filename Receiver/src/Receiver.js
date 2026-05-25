const { validateCliArgs } = require('./config/cliValidator');

// 1. Validate CLI parameters FIRST to determine the environment
const args = process.argv.slice(2);
const cliParams = validateCliArgs(args);

// 2. Set NODE_ENV BEFORE requiring config so it loads prod.json or dr.json correctly
process.env.NODE_ENV = cliParams.env.toLowerCase();

// Now we can safely require config and other modules
const { loadConfig } = require('./config/configLoader');
const { initLogger, logInfo, displayError } = require('./logging/logger');
const { initRedis } = require('./storage/redisClient');
const stateManager = require('./runtime/stateManager');
const itchParserFactory = require('./itch/itchParserFactory');
const { connectSoupClient, disconnectSoupClient } = require('./soup/soupClient');
const socketIoServer = require('./servers/socketIoServer');
const relayTcpServer = require('./servers/relayTcpServer');
const retransmissionTcpServer = require('./servers/retransmissionTcpServer');
const { registerShutdownHandler } = require('./runtime/shutdownManager');

async function main() {
  try {
    // 3. Load Config based on the now-set environment
    const config = loadConfig(cliParams.env);

    // 4. Init Logger
    initLogger(config.runtime.logFolder, cliParams.initials, cliParams.displayOn);
    logInfo('Application starting', { cliParams });

    // 5. Init Redis
    initRedis(config.redis);

    // 6. Init State Manager (clears or loads session depending on START:Y/N)
    await stateManager.initializeState(cliParams.startY);

    // 7. Get correct ITCH Parser
    const itchParser = itchParserFactory.getParser(cliParams.version);

    // 8. Start Servers
    const ioServer = socketIoServer.startSocketIoServer(config.servers.socketIoPort);
    const relayServer = relayTcpServer.startRelayTcpServer(config.servers.relayTcpPort);
    retransmissionTcpServer.startRetransmissionTcpServer(config.servers.retransmissionTcpPort);

    // Register Shutdown Handlers
    registerShutdownHandler(() => {
      disconnectSoupClient();
      socketIoServer.stopSocketIoServer();
      relayTcpServer.stopRelayTcpServer();
      retransmissionTcpServer.stopRetransmissionTcpServer();
    });

    // 9. Connect SoupBinTCP
    connectSoupClient(config, itchParser, socketIoServer, relayTcpServer);

  } catch (err) {
    displayError(`Failed to start application: ${err.message}`);
    process.exit(1);
  }
}

main();
