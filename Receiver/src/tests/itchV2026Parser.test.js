const itchParser = require('../itch/v2026/itchV2026Parser');

describe('ITCH V2026 Parser', () => {
  test('should parse Seconds message (T)', () => {
    // Type 1 + Second 4 = 5 bytes
    const buf = Buffer.alloc(5);
    buf.write('T', 0, 1, 'ascii');
    buf.writeUInt32BE(34200, 1);

    const result = itchParser.parse(buf);
    expect(result).toEqual({ messageType: 'T', second: 34200 });
  });

  test('should parse System Event message (S)', () => {
    // Type 1 + Nanos 4 + EventCode 1 = 6 bytes
    const buf = Buffer.alloc(6);
    buf.write('S', 0, 1, 'ascii');
    buf.writeUInt32BE(123456789, 1); // nanos
    buf.write('O', 5, 1, 'ascii');

    const result = itchParser.parse(buf);
    expect(result).toEqual({ messageType: 'S', nanos: 123456789, eventCode: 'O' });
  });
});
