export class SLIPCodec {
  private static readonly START = 0x5a;
  private static readonly END = 0xc0;
  private static readonly ESC = 0xdb;
  private static readonly ESC_END = 0xdc;
  private static readonly ESC_ESC = 0xdd;
  private static readonly ESC_START = 0xde;

  private buffer: number[] = [];
  private inPacket: boolean = false;

  encode(data: Uint8Array): Uint8Array {
    const result: number[] = [];
    result.push(SLIPCodec.START);
    for (const byte of data) {
      if (byte === SLIPCodec.END) {
        result.push(SLIPCodec.ESC, SLIPCodec.ESC_END);
      } else if (byte === SLIPCodec.ESC) {
        result.push(SLIPCodec.ESC, SLIPCodec.ESC_ESC);
      } else if (byte === SLIPCodec.START) {
        result.push(SLIPCodec.ESC, SLIPCodec.ESC_START);
      } else {
        result.push(byte);
      }
    }
    result.push(SLIPCodec.END);
    return new Uint8Array(result);
  }

  decode(chunk: Uint8Array): Uint8Array | null {
    for (const byte of chunk) {
      if (!this.inPacket) {
        if (byte === SLIPCodec.START) {
          this.inPacket = true;
          this.buffer = [];
        }
      } else if (byte === SLIPCodec.END) {
        const packet = Uint8Array.from(this.buffer);
        this.buffer = [];
        this.inPacket = false;
        return packet;
      } else {
        this.buffer.push(byte);
      }
    }
    return null;
  }
}
