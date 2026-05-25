function buildLoginRequest(username, password, requestedSession, requestedSequenceNumber) {
  // Packet Length (2) + Packet Type (1) + Username (6) + Password (10) + Session (10) + Sequence (20) = 49 total length
  const payloadLength = 1 + 6 + 10 + 10 + 20;
  const buffer = Buffer.alloc(2 + payloadLength);

  let offset = 0;
  buffer.writeUInt16BE(payloadLength, offset);
  offset += 2;

  buffer.write('L', offset, 1, 'ascii'); // Packet Type
  offset += 1;

  // Username: 6 chars right padded with spaces
  buffer.write(username.padEnd(6, ' ').substring(0, 6), offset, 6, 'ascii');
  offset += 6;

  // Password: 10 chars right padded with spaces
  buffer.write(password.padEnd(10, ' ').substring(0, 10), offset, 10, 'ascii');
  offset += 10;

  // Requested Session: 10 chars right padded with spaces. Blank means start new.
  const sessionStr = requestedSession || '';
  buffer.write(sessionStr.padEnd(10, ' ').substring(0, 10), offset, 10, 'ascii');
  offset += 10;

  // Requested Sequence Number: 20 chars right padded with spaces
  const seqStr = requestedSequenceNumber.toString();
  buffer.write(seqStr.padEnd(20, ' ').substring(0, 20), offset, 20, 'ascii');

  return buffer;
}

function buildClientHeartbeat() {
  const buffer = Buffer.alloc(3);
  buffer.writeUInt16BE(1, 0); // length 1
  buffer.write('R', 2, 1, 'ascii'); // type 'R'
  return buffer;
}

function buildLogoutRequest() {
  const buffer = Buffer.alloc(3);
  buffer.writeUInt16BE(1, 0);
  buffer.write('O', 2, 1, 'ascii');
  return buffer;
}

module.exports = {
  buildLoginRequest,
  buildClientHeartbeat,
  buildLogoutRequest
};
