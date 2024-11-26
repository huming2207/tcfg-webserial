export class SerialPortManager {
  private port: SerialPort | undefined;
  private writer: WritableStreamDefaultWriter<Uint8Array> | undefined;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private slip: SLIP;

  constructor() {
    this.slip = new SLIP();
  }

  async open(baud: number): Promise<void> {
    // Request a port using the Web Serial API
    this.port = await navigator.serial.requestPort();
    if (!this.port) {
      throw new Error("Serial port request failed!");
    }

    await this.port.open({ baudRate: baud });

    if (!this.port.writable || !this.port.readable) {
      throw new Error("Cannot read/write to serial port!");
    }

    // Access the writer and reader directly from the port
    this.writer = this.port.writable.getWriter();
    this.reader = this.port.readable.getReader();
  }

  async send(buf: Buffer): Promise<void> {
    if (!this.writer) throw new Error("Serial port is not open");
    const encoded = this.slip.encode(buf);
    await this.writer.write(encoded);
  }

  async recv(): Promise<Buffer> {
    if (!this.reader) throw new Error("Serial port is not open");

    while (true) {
      const { value, done } = await this.reader.read();
      if (done) break;
      if (value) {
        const packet = this.slip.pushAndDecode(value);
        if (packet) return packet;
      }
    }
    throw new Error("Stream ended without receiving a complete SLIP packet");
  }

  async close(): Promise<void> {
    if (this.reader) {
      await this.reader.cancel();
      this.reader = null;
    }
    if (this.writer) {
      this.writer.releaseLock();
    }
    if (this.port) {
      await this.port.close();
    }
  }
}

export class SLIP {
  private static readonly START = 0x5a;
  private static readonly END = 0xc0;
  private static readonly ESC = 0xdb;
  private static readonly ESC_END = 0xdc;
  private static readonly ESC_ESC = 0xdd;
  private static readonly ESC_START = 0xde;

  private buffer: number[] = [];
  private inPacket: boolean = false;

  encode(buffer: Buffer): Uint8Array {
    const result: number[] = [];
    result.push(SLIP.START); // Start with a START byte
    for (const byte of buffer) {
      if (byte === SLIP.END) {
        result.push(SLIP.ESC, SLIP.ESC_END);
      } else if (byte === SLIP.ESC) {
        result.push(SLIP.ESC, SLIP.ESC_ESC);
      } else if (byte === SLIP.START) {
        result.push(SLIP.ESC, SLIP.ESC_START);
      } else {
        result.push(byte);
      }
    }
    result.push(SLIP.END); // End with an END byte
    return new Uint8Array(result);
  }

  private decode(buffer: Uint8Array): Buffer {
    const result: number[] = [];
    let escaping = false;

    for (const byte of buffer) {
      if (escaping) {
        if (byte === SLIP.ESC_END) {
          result.push(SLIP.END);
        } else if (byte === SLIP.ESC_ESC) {
          result.push(SLIP.ESC);
        } else if (byte === SLIP.ESC_START) {
          result.push(SLIP.START);
        }
        escaping = false;
      } else if (byte === SLIP.ESC) {
        escaping = true;
      } else if (byte !== SLIP.END) {
        result.push(byte);
      }
    }

    return Buffer.from(result);
  }

  pushAndDecode(chunk: Uint8Array): Buffer | null {
    for (const byte of chunk) {
      if (!this.inPacket) {
        if (byte === SLIP.START) {
          this.inPacket = true; // Start processing after START byte
          this.buffer = [];
        }
      } else if (byte === SLIP.END) {
        const packet = this.decode(new Uint8Array(this.buffer));
        this.buffer = [];
        this.inPacket = false;
        return packet;
      } else {
        this.buffer.push(byte);
      }
    }
    return null; // No complete packet yet
  }
}
