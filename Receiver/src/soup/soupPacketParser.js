const { logError } = require('../logging/logger');

function parsePacketHeader(buffer) {
  if (buffer.length < 3) return null;
  const length = buffer.readUInt16BE(0);
  const packetType = buffer.toString('ascii', 2, 3);
  return { length, packetType };
}

function parseLoginAccepted(buffer) {
  try {
    const session = buffer.toString('ascii', 3, 13).trim();
    const nextSequenceNo = parseInt(buffer.toString('ascii', 13, 33).trim(), 10);
    return { packetType: 'A', session, nextSequenceNo };
  } catch (err) {
    logError('Error parsing Login Accepted', { error: err.message });
    return { packetType: 'A', error: err.message };
  }
}

function parseLoginRejected(buffer) {
  try {
    const rejectReasonCode = buffer.toString('ascii', 3, 4);
    return { packetType: 'J', rejectReasonCode };
  } catch (err) {
    logError('Error parsing Login Rejected', { error: err.message });
    return { packetType: 'J', error: err.message };
  }
}

function parseDebugPacket(buffer) {
  try {
    const text = buffer.toString('ascii', 3);
    return { packetType: '+', text };
  } catch (err) {
    logError('Error parsing Debug Packet', { error: err.message });
    return { packetType: '+', error: err.message };
  }
}

function parseSoupPacket(buffer) {
  const header = parsePacketHeader(buffer);
  if (!header) return null;

  switch (header.packetType) {
    case 'A': return parseLoginAccepted(buffer);
    case 'J': return parseLoginRejected(buffer);
    case 'S': return { packetType: 'S', payloadLength: header.length - 1 };
    case 'U': return { packetType: 'U', payloadLength: header.length - 1 };
    case 'H': return { packetType: 'H' };
    case 'Z': return { packetType: 'Z' };
    case '+': return parseDebugPacket(buffer);
    default: return { packetType: header.packetType };
  }
}

module.exports = {
  parseSoupPacket,
  parsePacketHeader
};
