const { getClient, getPrefix } = require('./redisClient');
const { logError } = require('../logging/logger');

async function saveState(stateKey, data) {
  const redis = getClient();
  const prefix = getPrefix();
  try {
    // Handling Map stringification automatically or assume data is plain object/array
    let strData = JSON.stringify(data);
    if (data instanceof Map) {
      strData = JSON.stringify(Array.from(data.entries()));
    }
    await redis.set(`${prefix}:${stateKey}`, strData);
  } catch (err) {
    logError(`Error saving state to Redis: ${stateKey}`, { error: err.message });
  }
}

async function loadState(stateKey, isMap = false) {
  const redis = getClient();
  const prefix = getPrefix();
  try {
    const dataStr = await redis.get(`${prefix}:${stateKey}`);
    if (dataStr) {
      const parsed = JSON.parse(dataStr);
      return isMap ? new Map(parsed) : parsed;
    }
  } catch (err) {
    logError(`Error loading state from Redis: ${stateKey}`, { error: err.message });
  }
  return isMap ? new Map() : null;
}

async function saveSequence(sequenceNo) {
  const redis = getClient();
  const prefix = getPrefix();
  try {
    await redis.set(`${prefix}:lastSequenceNo`, sequenceNo.toString());
  } catch (err) {
    logError('Error saving sequence to Redis', { error: err.message });
  }
}

async function loadSequence() {
  const redis = getClient();
  const prefix = getPrefix();
  try {
    const seqStr = await redis.get(`${prefix}:lastSequenceNo`);
    return seqStr ? parseInt(seqStr, 10) : 0;
  } catch (err) {
    logError('Error loading sequence from Redis', { error: err.message });
    return 0;
  }
}

async function markMessageProcessed(sequenceNo, messageJSON) {
  const redis = getClient();
  const prefix = getPrefix();
  try {
    await redis.set(`${prefix}:processed:${sequenceNo}`, JSON.stringify(messageJSON));
  } catch (err) {
    logError(`Error marking message processed in Redis: ${sequenceNo}`, { error: err.message });
  }
}

async function clearProcessorKeys() {
  const redis = getClient();
  const prefix = getPrefix();
  try {
    let cursor = '0';
    do {
      const [newCursor, keys] = await redis.scan(cursor, 'MATCH', `${prefix}:*`, 'COUNT', 100);
      cursor = newCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== '0');
  } catch (err) {
    logError('Error clearing PROCESSOR keys', { error: err.message });
  }
}

module.exports = {
  saveState,
  loadState,
  saveSequence,
  loadSequence,
  markMessageProcessed,
  clearProcessorKeys
};
