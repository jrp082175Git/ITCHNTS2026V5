const config = require('config');
const dotenv = require('dotenv');

dotenv.config();

function loadConfig(environment) {
  const isProd = environment === 'PROD';

  // Allow overriding from .env first, fallback to config files (prod.json / dr.json)
  const envHost = isProd ? process.env.ITCH_PROD_HOST : process.env.ITCH_DR_HOST;
  const envPort = isProd ? process.env.ITCH_PROD_PORT : process.env.ITCH_DR_PORT;

  return {
    itch: {
      host: envHost || config.get('itch.host'),
      port: envPort ? parseInt(envPort, 10) : config.get('itch.port'),
      username: process.env.ITCH_USERNAME || (config.has('itch.username') ? config.get('itch.username') : undefined),
      password: process.env.ITCH_PASSWORD || (config.has('itch.password') ? config.get('itch.password') : undefined)
    },
    redis: {
      host: process.env.REDIS_HOST || config.get('redis.host'),
      port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : config.get('redis.port'),
      password: process.env.REDIS_PASSWORD || config.get('redis.password'),
      db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB, 10) : config.get('redis.db'),
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
