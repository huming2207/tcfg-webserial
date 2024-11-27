import { EventEmitter } from "events";
import {
  ChunkAckPacket,
  DeviceInfoPacket,
  IChunkAckPacket,
  IDeviceInfoPacket,
  IPacketHeader,
  IUptimePacket,
  PacketHeader,
  PacketType,
  UptimePacket,
} from "../schema/packet";

export class SerialPortManager extends EventEmitter {
  private port: SerialPort | undefined;
  private writer: WritableStreamDefaultWriter<Uint8Array> | undefined;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private slip: SLIPCodec;

  constructor() {
    super();
    this.slip = new SLIPCodec();
  }

  async open(baud: number): Promise<void> {
    this.port = await navigator.serial.requestPort();
    if (!this.port) throw new Error("Serial port request failed!");

    await this.port.open({ baudRate: baud });

    if (!this.port.writable || !this.port.readable) {
      throw new Error("Cannot read/write to serial port!");
    }

    this.writer = this.port.writable.getWriter();
    this.reader = this.port.readable.getReader();

    this.startRecv();
  }

  async send(data: Uint8Array): Promise<void> {
    if (!this.writer) throw new Error("Serial port is not open");
    const encoded = this.slip.encode(data);
    await this.writer.write(encoded);
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

  private async startRecv(): Promise<void> {
    if (!this.reader) return;

    try {
      while (true) {
        const { value, done } = await this.reader.read();
        if (done) break;

        if (value) {
          const rawPktBuf = this.slip.pushAndDecode(value);
          if (rawPktBuf) {
            try {
              const packet = this.parsePacket(rawPktBuf);
              if (packet) {
                const { header, payload } = packet;
                const packetType = header.type;

                // Emit events for specific packet types
                switch (packetType) {
                  case PacketType.PKT_ACK: {
                    this.emit("ack", { header: header, payload: null });
                    break;
                  }
                  case PacketType.PKT_NACK: {
                    this.emit("nack", { header: header, payload: null });
                    break;
                  }
                  case PacketType.PKT_CHUNK_ACK: {
                    this.emit("chunkAck", { header: header, payload: payload });
                    break;
                  }
                  case PacketType.PKT_CONFIG_RESULT: {
                    this.emit("configResult", { header: header, payload: payload });
                    break;
                  }
                  case PacketType.PKT_UPTIME: {
                    this.emit("uptime", { header: header, payload });
                    break;
                  }
                  case PacketType.PKT_DEV_INFO: {
                    this.emit("devInfo", { header: header, payload });
                    break;
                  }
                  default: {
                    this.emit("unknown", { header: header, payload });
                    break;
                  }
                }
              }
            } catch (error) {
              this.emit("error", error);
            }
          }
        }
      }
    } catch (error) {
      this.emit("error", error);
    }
  }

  private validateAndExtract(packet: Uint8Array): { header: IPacketHeader; payload: Uint8Array } {
    if (packet.length < 3) throw new Error("Packet too short to validate CRC");

    const expectCrc = (packet[2] << 8) | packet[1];
    const bytes = Uint8Array.from(packet);
    bytes[1] = 0;
    bytes[2] = 0;

    const calculatedCrc = this.calculateCrc16XMODEM(bytes, 0x0000);
    if (expectCrc !== calculatedCrc) {
      throw new Error(`Invalid CRC: Calculated ${calculatedCrc.toString(16)} != Expected ${expectCrc.toString(16)}`);
    }

    const header = PacketHeader.parse(packet) as IPacketHeader;
    const payload = packet.slice(PacketHeader.sizeOf());

    return { header, payload };
  }

  private parsePacket(packet: Uint8Array): { header: IPacketHeader; payload: unknown } | null {
    const { header, payload } = this.validateAndExtract(packet);

    switch (header.type) {
      case PacketType.PKT_UPTIME:
        return { header, payload: UptimePacket.parse(payload) as IUptimePacket };
      case PacketType.PKT_DEV_INFO:
        return { header, payload: DeviceInfoPacket.parse(payload) as IDeviceInfoPacket };
      case PacketType.PKT_CHUNK_ACK:
        return { header, payload: ChunkAckPacket.parse(payload) as IChunkAckPacket };
      default:
        return { header, payload: payload }; // Return raw payload for unknown packet types
    }
  }

  private calculateCrc16XMODEM(data: Uint8Array, init: number): number {
    const POLY = 0x1021;
    let crc = ~init & 0xffff;

    for (const byte of data) {
      crc ^= (byte << 8) & 0xffff;
      for (let i = 0; i < 8; i++) {
        if (crc & 0x8000) {
          crc = ((crc << 1) ^ POLY) & 0xffff;
        } else {
          crc = (crc << 1) & 0xffff;
        }
      }
    }

    return ~crc & 0xffff;
  }
}

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

  pushAndDecode(chunk: Uint8Array): Uint8Array | null {
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
