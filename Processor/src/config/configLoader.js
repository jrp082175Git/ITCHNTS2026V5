const config = require('config');
const dotenv = require('dotenv');

dotenv.config();

function loadConfig() {
  return {
    receiver: {
      relayHost: process.env.RECEIVER_RELAY_HOST || config.get('receiver.relayHost'),
      relayPort: process.env.RECEIVER_RELAY_PORT ? parseInt(process.env.RECEIVER_RELAY_PORT, 10) : config.get('receiver.relayPort'),
      retransHost: process.env.RECEIVER_RETRANS_HOST || config.get('receiver.retransHost'),
      retransPort: process.env.RECEIVER_RETRANS_PORT ? parseInt(process.env.RECEIVER_RETRANS_PORT, 10) : config.get('receiver.retransPort')
    },
    redis: {
      host: process.env.REDIS_HOST || config.get('redis.host'),
      port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : config.get('redis.port'),
      password: process.env.REDIS_PASSWORD || config.get('redis.password'),
      db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB, 10) : config.get('redis.db'),
      keyPrefix: config.get('redis.keyPrefix')
    },
    servers: {
      socketIoPort: config.get('servers.socketIoPort')
    },
    runtime: {
      reconnectIntervalMs: config.get('runtime.reconnectIntervalMs'),
      maxRetransmissionRange: config.get('runtime.maxRetransmissionRange'),
      maxQueueSize: config.get('runtime.maxQueueSize'),
      logFolder: config.get('runtime.logFolder'),
      snapshotIntervalMs: config.get('runtime.snapshotIntervalMs')
    }
  };
}

module.exports = { loadConfig };
