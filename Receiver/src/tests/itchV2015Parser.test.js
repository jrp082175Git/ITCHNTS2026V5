const itchParser = require('../itch/v2015/itchV2015Parser');

describe('ITCH V2015 Parser', () => {
  test('should parse Time Stamp message (T)', () => {
    // Type 1 + Second 4 = 5 bytes
    const buf = Buffer.alloc(5);
    buf.write('T', 0, 1, 'ascii');
    buf.writeUInt32BE(34200, 1);

    const result = itchParser.parse(buf);
    expect(result).toEqual({ messageType: 'T', second: 34200 });
  });

  test('should parse System Event message (S)', () => {
    // Type 1 + EventCode 1 = 2 bytes
    const buf = Buffer.alloc(2);
    buf.write('S', 0, 1, 'ascii');
    buf.write('O', 1, 1, 'ascii');

    const result = itchParser.parse(buf);
    expect(result).toEqual({ messageType: 'S', eventCode: 'O' });
  });
});
