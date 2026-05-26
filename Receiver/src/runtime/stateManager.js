const { clearItchKeys } = require('../storage/redisRepository');
const { loadSession } = require('../storage/sessionStore');
const { logInfo } = require('../logging/logger');

const MAX_ARRAY_SIZE = 5000;

const state = {
  packet: new Array(MAX_ARRAY_SIZE),
  packetJSON: new Array(MAX_ARRAY_SIZE),
  messages: new Array(MAX_ARRAY_SIZE),
  messagesJSON: new Array(MAX_ARRAY_SIZE),
  head: 0,
  maxSize: MAX_ARRAY_SIZE,
  sessionId: '',
  currentSequenceNo: 1,
  isLoggedIn: false
};

async function initializeState(startY) {
  if (startY) {
    logInfo('START:Y requested. Clearing state and redis keys.');
    state.packet = new Array(MAX_ARRAY_SIZE);
    state.packetJSON = new Array(MAX_ARRAY_SIZE);
    state.messages = new Array(MAX_ARRAY_SIZE);
    state.messagesJSON = new Array(MAX_ARRAY_SIZE);
    state.head = 0;
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
  state.packet[state.head] = raw;
  state.packetJSON[state.head] = json;
}

function addMessage(raw, json) {
  state.messages[state.head] = raw;
  state.messagesJSON[state.head] = json;

  // Advance ring buffer head for both arrays since they move together usually
  state.head = (state.head + 1) % MAX_ARRAY_SIZE;
}

module.exports = {
  initializeState,
  getState,
  addPacket,
  addMessage
};
