const { getClient, getPrefix } = require('./redisClient');
const fs = require('fs');
const path = require('path');
const { logError, logInfo } = require('../logging/logger');

const SESSION_FILE_PATH = path.join(__dirname, '../../config/session.txt');

async function saveSession(sessionId, sequenceNo) {
  const redis = getClient();
  const prefix = getPrefix();

  try {
    await redis.set(`${prefix}:session:current`, sessionId);
    await redis.set(`${prefix}:sequence:last`, sequenceNo.toString());
    fs.writeFileSync(SESSION_FILE_PATH, `${sessionId},${sequenceNo}`, 'utf8');
  } catch (err) {
    logError('Error saving session', { error: err.message });
  }
}

async function loadSession() {
  const redis = getClient();
  const prefix = getPrefix();

  try {
    const sessionId = await redis.get(`${prefix}:session:current`);
    const lastSeq = await redis.get(`${prefix}:sequence:last`);

    if (sessionId && lastSeq) {
      return { sessionId, lastSequenceNo: parseInt(lastSeq, 10) };
    }

    // Fallback to file
    if (fs.existsSync(SESSION_FILE_PATH)) {
      const content = fs.readFileSync(SESSION_FILE_PATH, 'utf8');
      const parts = content.split(',');
      if (parts.length === 2) {
        return { sessionId: parts[0], lastSequenceNo: parseInt(parts[1], 10) };
      }
    }
  } catch (err) {
    logError('Error loading session', { error: err.message });
  }

  return { sessionId: '', lastSequenceNo: 0 };
}

async function updateLastSequence(sequenceNo) {
  const redis = getClient();
  const prefix = getPrefix();

  try {
    await redis.set(`${prefix}:sequence:last`, sequenceNo.toString());
  } catch (err) {
    logError('Error updating last sequence', { error: err.message });
  }
}

module.exports = {
  saveSession,
  loadSession,
  updateLastSequence
};
