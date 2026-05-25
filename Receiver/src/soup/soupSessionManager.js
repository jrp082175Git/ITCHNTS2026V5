const { parseSoupPacket } = require('./soupPacketParser');
const { storePacket, storeMessage } = require('../storage/redisRepository');
const { saveSession, updateLastSequence } = require('../storage/sessionStore');
const stateManager = require('../runtime/stateManager');
const { logPacket, logInfo, logError, display } = require('../logging/logger');
const { updateLastReceived } = require('../runtime/heartbeatManager');

class SoupSessionManager {
  constructor(itchParser, socketIoServer, relayTcpServer) {
    this.itchParser = itchParser;
    this.socketIoServer = socketIoServer;
    this.relayTcpServer = relayTcpServer;
  }

  async handlePacket(buffer) {
    updateLastReceived();
    const packetJSON = parseSoupPacket(buffer);
    if (!packetJSON) return;

    const state = stateManager.getState();
    const seq = state.currentSequenceNo; // For logging/storage indexing if not S packet

    stateManager.addPacket(buffer, packetJSON);

    // Depending on burst traffic, you may want to offload redis storage to background
    await storePacket(seq, buffer, packetJSON);
    logPacket(packetJSON);

    // Broadcast packet
    if (this.socketIoServer) {
      this.socketIoServer.emit('packet', packetJSON);
    }

    switch (packetJSON.packetType) {
      case 'A': await this.handleLoginAccepted(packetJSON); break;
      case 'J': this.handleLoginRejected(packetJSON); break;
      case 'S': await this.handleSequencedData(buffer, packetJSON); break;
      case 'H': this.handleServerHeartbeat(); break;
      case 'Z': this.handleEndOfSession(packetJSON); break;
    }
  }

  async handleLoginAccepted(packetJSON) {
    const state = stateManager.getState();
    state.sessionId = packetJSON.session;
    state.currentSequenceNo = packetJSON.nextSequenceNo;
    state.isLoggedIn = true;

    await saveSession(state.sessionId, state.currentSequenceNo - 1); // save last known good

    display('Login Accepted.');
    if (this.socketIoServer) {
      this.socketIoServer.emit('loginAccepted', packetJSON);
    }
  }

  handleLoginRejected(packetJSON) {
    display('Login Rejected.');
    if (this.socketIoServer) {
      this.socketIoServer.emit('loginRejected', packetJSON);
    }
    // Caller should close socket based on state/events
  }

  async handleSequencedData(buffer, packetJSON) {
    const state = stateManager.getState();
    const payload = buffer.slice(3); // skip 2 byte length + 1 byte type S

    const messageJSON = this.itchParser(payload);

    // Assign local sequence
    const msgSeq = state.currentSequenceNo;
    messageJSON.sequenceNo = msgSeq;

    stateManager.addMessage(payload, messageJSON);

    // Store message
    await storeMessage(msgSeq, payload, messageJSON);
    await updateLastSequence(msgSeq);

    state.currentSequenceNo++; // Increment only after valid storage

    if (this.socketIoServer) {
      this.socketIoServer.emit('message', messageJSON);
    }

    if (this.relayTcpServer) {
      this.relayTcpServer.broadcastMessage(messageJSON);
    }

    // Display parsed object stringified if DISPLAY:ON
    display(JSON.stringify(messageJSON));
  }

  handleServerHeartbeat() {
    const state = stateManager.getState();
    const hbObj = { packetType: "R", latestStoredSequenceNo: state.currentSequenceNo - 1 };

    if (this.relayTcpServer) {
      this.relayTcpServer.broadcastMessage(hbObj);
    }

    if (this.socketIoServer) {
      this.socketIoServer.emit('heartbeat', hbObj);
    }
    // Client Heartbeat packet sending is handled by heartbeatManager
  }

  handleEndOfSession(packetJSON) {
    display('End of Session');
    if (this.socketIoServer) {
      this.socketIoServer.emit('endOfSession', packetJSON);
    }
    logInfo('End of session received. Initiating graceful shutdown.');
    // In production, emit event to main app to close safely
    setTimeout(() => {
        const { shutdown } = require('../runtime/shutdownManager');
        shutdown(0);
    }, 1000);
  }
}

module.exports = SoupSessionManager;
