const { clearItchKeys } = require('../storage/redisRepository');
const { loadSession } = require('../storage/sessionStore');
const { logInfo, display } = require('../logging/logger');
const socketIoServer = require('../servers/socketIoServer');

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
  isLoggedIn: false,
  connectionStatus: 'Disconnected' // Added connection status tracking
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

function setConnectionStatus(status) {
  state.connectionStatus = status;
  display(`[STATUS] ${status}`);
  // Broadcast connection status to connected frontends
  if (socketIoServer) {
      socketIoServer.emit('connectionStatus', { status });
  }
}

function addPacket(raw, json) {
  state.packet[state.head] = raw;
  state.packetJSON[state.head] = json;

  // Advance head when a packet is added (fixes previous issue where J packet could be missed)
  state.head = (state.head + 1) % MAX_ARRAY_SIZE;
}

function addMessage(raw, json) {
  // Messages are stored along with the packet index theoretically,
  // but if we treat them completely separately we can just use the same head conceptually
  // To avoid confusion, let's keep them synced to the same head which we advanced in addPacket
  let writeIdx = (state.head - 1 + MAX_ARRAY_SIZE) % MAX_ARRAY_SIZE; // Write to the index we just added the packet to
  state.messages[writeIdx] = raw;
  state.messagesJSON[writeIdx] = json;
}

module.exports = {
  initializeState,
  getState,
  setConnectionStatus,
  addPacket,
  addMessage
};
