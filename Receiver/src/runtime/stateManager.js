const { clearItchKeys } = require('../storage/redisRepository');
const { loadSession } = require('../storage/sessionStore');
const { logInfo } = require('../logging/logger');

const MAX_ARRAY_SIZE = 5000;

const state = {
  packet: [],
  packetJSON: [],
  messages: [],
  messagesJSON: [],
  sessionId: '',
  currentSequenceNo: 1,
  isLoggedIn: false
};

async function initializeState(startY) {
  if (startY) {
    logInfo('START:Y requested. Clearing state and redis keys.');
    state.packet = [];
    state.packetJSON = [];
    state.messages = [];
    state.messagesJSON = [];
    state.sessionId = '';
    state.currentSequenceNo = 1;
    await clearItchKeys();
  } else {
    logInfo('START:N requested. Loading previous session.');
    const sessionData = await loadSession();
    state.sessionId = sessionData.sessionId;
    state.currentSequenceNo = sessionData.lastSequenceNo + 1;
    logInfo('Session loaded', { sessionId: state.sessionId, nextSequenceNo: state.currentSequenceNo });
  }
}

function getState() {
  return state;
}

function addPacket(raw, json) {
  state.packet.push(raw);
  state.packetJSON.push(json);

  // Prevent memory leak
  if (state.packet.length > MAX_ARRAY_SIZE) {
    state.packet.shift();
    state.packetJSON.shift();
  }
}

function addMessage(raw, json) {
  state.messages.push(raw);
  state.messagesJSON.push(json);

  // Prevent memory leak
  if (state.messages.length > MAX_ARRAY_SIZE) {
    state.messages.shift();
    state.messagesJSON.shift();
  }
}

module.exports = {
  initializeState,
  getState,
  addPacket,
  addMessage
};
