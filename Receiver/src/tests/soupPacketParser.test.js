const { parsePacketHeader, parseSoupPacket } = require('../soup/soupPacketParser');

describe('SoupBinTCP Packet Parser', () => {
  test('should parse Packet Header correctly', () => {
    const buf = Buffer.alloc(3);
    buf.writeUInt16BE(15, 0);
    buf.write('A', 2, 1, 'ascii');

    const header = parsePacketHeader(buf);
    expect(header).toEqual({ length: 15, packetType: 'A' });
  });

  test('should parse Login Accepted packet', () => {
    // Length 2, Type 1, Session 10, Sequence 20 = 33 total
    const buf = Buffer.alloc(33);
    buf.writeUInt16BE(31, 0); // length
    buf.write('A', 2, 1, 'ascii'); // type
    buf.write('SESSION1  ', 3, 10, 'ascii');
    buf.write('12345               ', 13, 20, 'ascii');

    const result = parseSoupPacket(buf);
    expect(result).toEqual({ packetType: 'A', session: 'SESSION1', nextSequenceNo: 12345 });
  });

  test('should parse Login Rejected packet', () => {
    // Length 2, Type 1, Reason 1 = 4 total
    const buf = Buffer.alloc(4);
    buf.writeUInt16BE(2, 0);
    buf.write('J', 2, 1, 'ascii');
    buf.write('A', 3, 1, 'ascii');

    const result = parseSoupPacket(buf);
    expect(result).toEqual({ packetType: 'J', rejectReasonCode: 'A' });
  });

  test('should parse Server Heartbeat', () => {
    const buf = Buffer.alloc(3);
    buf.writeUInt16BE(1, 0);
    buf.write('H', 2, 1, 'ascii');

    const result = parseSoupPacket(buf);
    expect(result).toEqual({ packetType: 'H' });
  });

  test('should parse Sequenced Data metadata', () => {
    const buf = Buffer.alloc(10);
    buf.writeUInt16BE(8, 0);
    buf.write('S', 2, 1, 'ascii');

    const result = parseSoupPacket(buf);
    expect(result).toEqual({ packetType: 'S', payloadLength: 7 }); // length(8) - type(1) = 7
  });
});
