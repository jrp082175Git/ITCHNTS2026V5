const { getClient, getPrefix } = require('./redisClient');
const { logError } = require('../logging/logger');

async function storePacket(sequenceNo, rawBuffer, packetJSON) {
  const redis = getClient();
  const prefix = getPrefix();

  try {
    const pipeline = redis.pipeline();
    pipeline.set(`${prefix}:packet:${sequenceNo}`, rawBuffer.toString('base64'));
    pipeline.set(`${prefix}:packetJSON:${sequenceNo}`, JSON.stringify(packetJSON));
    await pipeline.exec();
  } catch (err) {
    logError('Error storing packet to Redis', { error: err.message, sequenceNo });
  }
}

async function storeMessage(sequenceNo, rawMessageBuffer, messageJSON) {
  const redis = getClient();
  const prefix = getPrefix();

  try {
    const pipeline = redis.pipeline();
    if (rawMessageBuffer) {
        pipeline.set(`${prefix}:message:${sequenceNo}`, rawMessageBuffer.toString('base64'));
    }
    pipeline.set(`${prefix}:messageJSON:${sequenceNo}`, JSON.stringify(messageJSON));
    pipeline.zadd(`${prefix}:messages:seqIndex`, sequenceNo, sequenceNo);
    await pipeline.exec();
  } catch (err) {
    logError('Error storing message to Redis', { error: err.message, sequenceNo });
  }
}

async function getMessagesBySequenceRange(beginSeq, endSeq) {
  const redis = getClient();
  const prefix = getPrefix();

  try {
    // Get sequence numbers in range
    const seqs = await redis.zrangebyscore(`${prefix}:messages:seqIndex`, beginSeq, endSeq);
    if (!seqs || seqs.length === 0) return [];

    const pipeline = redis.pipeline();
    seqs.forEach(seq => {
      pipeline.get(`${prefix}:messageJSON:${seq}`);
    });

    const results = await pipeline.exec();
    const messages = [];

    for (let i = 0; i < results.length; i++) {
      const [err, val] = results[i];
      if (!err && val) {
        messages.push(JSON.parse(val));
      }
    }
    return messages;
  } catch (err) {
    logError('Error fetching messages by sequence range', { error: err.message, beginSeq, endSeq });
    return [];
  }
}

async function clearItchKeys() {
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
    logError('Error clearing ITCH keys', { error: err.message });
  }
}

module.exports = {
  storePacket,
  storeMessage,
  getMessagesBySequenceRange,
  clearItchKeys
};
