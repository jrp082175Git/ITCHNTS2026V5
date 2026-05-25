const config = require('config');
const dotenv = require('dotenv');

dotenv.config();

function loadConfig(environment) {
  return {
    itch: {
      host: config.get('itch.host'),
      port: config.get('itch.port'),
      username: process.env.ITCH_USERNAME || (config.has('itch.username') ? config.get('itch.username') : undefined),
      password: process.env.ITCH_PASSWORD || (config.has('itch.password') ? config.get('itch.password') : undefined)
    },
    redis: {
      host: process.env.REDIS_HOST || config.get('redis.host'),
      port: process.env.REDIS_PORT || config.get('redis.port'),
      password: process.env.REDIS_PASSWORD || config.get('redis.password'),
      db: process.env.REDIS_DB || config.get('redis.db'),
      keyPrefix: config.get('redis.keyPrefix')
    },
    servers: {
      socketIoPort: config.get('servers.socketIoPort'),
      relayTcpPort: config.get('servers.relayTcpPort'),
      retransmissionTcpPort: config.get('servers.retransmissionTcpPort')
    },
    runtime: {
      heartbeatIntervalMs: config.get('runtime.heartbeatIntervalMs'),
      reconnectDelayBaseMs: config.get('runtime.reconnectDelayBaseMs'),
      reconnectMaxDelayMs: config.get('runtime.reconnectMaxDelayMs'),
      logFolder: config.get('runtime.logFolder')
    }
  };
}

module.exports = { loadConfig };
