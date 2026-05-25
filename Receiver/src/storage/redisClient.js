const Redis = require('ioredis');
const { logError, logInfo } = require('../logging/logger');

let redisClient = null;
let prefix = 'ITCH';

function initRedis(config) {
  prefix = config.keyPrefix || 'ITCH';

  redisClient = new Redis({
    host: config.host,
    port: config.port,
    password: config.password,
    db: config.db,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    }
  });

  redisClient.on('error', (err) => {
    logError('Redis connection error', { error: err.message });
  });

  redisClient.on('connect', () => {
    logInfo('Connected to Redis');
  });

  return redisClient;
}

function getClient() {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
}

function getPrefix() {
  return prefix;
}

async function closeRedis() {
  if (redisClient) {
    await redisClient.quit();
  }
}

module.exports = {
  initRedis,
  getClient,
  getPrefix,
  closeRedis
};
