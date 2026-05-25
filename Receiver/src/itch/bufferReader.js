class BufferReader {
  constructor(buffer) {
    this.buffer = buffer;
    this.offset = 0;
  }

  getRemaining() {
    return this.buffer.length - this.offset;
  }

  readAlpha(length) {
    this.checkLength(length);
    const val = this.buffer.toString('ascii', this.offset, this.offset + length).trimEnd();
    this.offset += length;
    return val;
  }

  readUInt8() {
    this.checkLength(1);
    const val = this.buffer.readUInt8(this.offset);
    this.offset += 1;
    return val;
  }

  readUInt16BE() {
    this.checkLength(2);
    const val = this.buffer.readUInt16BE(this.offset);
    this.offset += 2;
    return val;
  }

  readUInt32BE() {
    this.checkLength(4);
    const val = this.buffer.readUInt32BE(this.offset);
    this.offset += 4;
    return val;
  }

  readInt32BE() {
    this.checkLength(4);
    const val = this.buffer.readInt32BE(this.offset);
    this.offset += 4;
    return val;
  }

  readBigUInt64BE() {
    this.checkLength(8);
    const val = this.buffer.readBigUInt64BE(this.offset);
    this.offset += 8;
    return val;
  }

  readBigInt64BE() {
    this.checkLength(8);
    const val = this.buffer.readBigInt64BE(this.offset);
    this.offset += 8;
    return val;
  }

  readPriceV2015(decimals) {
    const raw = this.readUInt32BE();
    return raw / Math.pow(10, decimals || 4); // Default 4 decimals if not provided
  }

  readPriceV2026(decimals) {
    const raw = Number(this.readBigInt64BE());
    return raw / Math.pow(10, decimals || 8); // Default 8 decimals for V2026 if not dynamically passed
  }

  checkLength(length) {
    if (this.offset + length > this.buffer.length) {
      throw new Error(`Buffer overflow. Needed ${length}, but only ${this.buffer.length - this.offset} remaining.`);
    }
  }
}

module.exports = BufferReader;
