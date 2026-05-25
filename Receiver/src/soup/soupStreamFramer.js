const { EventEmitter } = require('events');

class SoupStreamFramer extends EventEmitter {
  constructor() {
    super();
    this.buffer = Buffer.alloc(0);
  }

  append(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    this.process();
  }

  process() {
    while (this.buffer.length >= 2) {
      const packetLength = this.buffer.readUInt16BE(0);
      const totalLength = 2 + packetLength;

      if (this.buffer.length >= totalLength) {
        const fullPacket = this.buffer.slice(0, totalLength);
        this.buffer = this.buffer.slice(totalLength);
        this.emit('packet', fullPacket);
      } else {
        break; // Wait for more data
      }
    }
  }

  clear() {
    this.buffer = Buffer.alloc(0);
  }
}

module.exports = SoupStreamFramer;
