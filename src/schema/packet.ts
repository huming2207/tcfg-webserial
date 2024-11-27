import { Parser } from "binary-parser";

export enum PacketType {
  PKT_GET_DEVICE_INFO = 1,
  PKT_PING = 2,
  PKT_GET_UPTIME = 3,
  PKT_REBOOT = 4,
  PKT_REBOOT_BOOTLOADER = 5,
  PKT_GET_CONFIG = 0x10,
  PKT_SET_CONFIG = 0x11,
  PKT_DEL_CONFIG = 0x12,
  PKT_NUKE_CONFIG = 0x13,
  PKT_BEGIN_FILE_WRITE = 0x20,
  PKT_FILE_CHUNK = 0x21,
  PKT_GET_FILE_INFO = 0x22,
  PKT_DELETE_FILE = 0x23,
  PKT_BEGIN_OTA = 0x30,
  PKT_OTA_CHUNK = 0x31,
  PKT_OTA_COMMIT = 0x32,
  PKT_BIN_RPC_REQUEST = 0x70,
  PKT_ACK = 0x80,
  PKT_CHUNK_ACK = 0x81,
  PKT_CONFIG_RESULT = 0x82,
  PKT_FILE_INFO = 0x83,
  PKT_UPTIME = 0x84,
  PKT_DEV_INFO = 0x85,
  PKT_BIN_RPC_REPLY = 0x86,
  PKT_JSON_RPC_REPLY = 0x87,
  PKT_NACK = 0xff,
}

export const PacketHeader = new Parser().endianess("little").uint8("type").uint16("crc").uint16("len");
export const NackPacket = new Parser().endianess("little").int32("ret");
export const UptimeReqPacket = new Parser().endianess("little").uint64("realtimeMillisec");
export const UptimePacket = new Parser()
  .endianess("little")
  .uint8("lastResetReason") // esp_reset_reason_t
  .uint64("uptime");
export const DeviceInfoPacket = new Parser()
  .endianess("little")
  .array("macAddr", { type: "uint8", length: 6 })
  .array("flashID", { type: "uint8", length: 8 })
  .string("sdkVer", { length: 16, stripNull: true })
  .string("compileTime", { length: 16, stripNull: true })
  .string("compileDate", { length: 16, stripNull: true })
  .string("modelName", { length: 32, stripNull: true })
  .string("firmwareVer", { length: 32, stripNull: true })
  .array("firmwareHash", { type: "uint8", length: 32 });
export const PathPacket = new Parser()
  .endianess("little")
  .uint32("len")
  .string("path", { length: 255, stripNull: true }); // UINT8_MAX = 255

export const ChunkPacket = new Parser().endianess("little").array("buf", { type: "uint8", readUntil: "eof" });

export const ChunkAckPacket = new Parser()
  .endianess("little")
  .uint8("state") // chunk_state is a uint8
  .uint32("auxInfo"); // aux_info is a uint32

export const ConfigPacket = new Parser()
  .endianess("little")
  .uint8("type") // nvs_type_t
  .uint16("valLen")
  .string("ns", { length: 16, stripNull: true })
  .string("key", { length: 16, stripNull: true })
  .array("value", { type: "uint8", length: "valLen" });

export const ConfigDeletionPacket = new Parser()
  .endianess("little")
  .string("ns", { length: 16, stripNull: true })
  .string("key", { length: 16, stripNull: true });

export const FileInfoPkt = new Parser().endianess("little").uint32("size").array("hash", { type: "uint8", length: 32 });

export interface IUptimeReqPacket {
  realtimeMillisec: number; // uint64
}

export interface IUptimePacket {
  lastResetReason: number; // uint8, esp_reset_reason_t
  uptime: number; // uint64
}

export interface IDeviceInfoPacket {
  macAddr: number[]; // uint8[6]
  flashID: number[]; // uint8[8]
  sdkVer: string; // char[16]
  compileTime: string; // char[16]
  compileDate: string; // char[16]
  modelName: string; // char[32]
  firmwareVer: string; // char[32]
  firmwareHash: number[]; // uint8[32]
}

export interface IPathPacket {
  len: number; // uint32
  path: string; // char[255]
}

export interface IChunkPacket {
  buf: number[]; // uint8[]
}

export interface IConfigPacket {
  type: number; // uint8, nvs_type_t
  valLen: number; // uint16
  ns: string; // char[16]
  key: string; // char[16]
  value: number[]; // uint8[]
}

export interface IConfigDeletionPacket {
  ns: string; // char[16]
  key: string; // char[16]
}

export interface IFileInfoPacket {
  size: number; // uint32
  hash: number[]; // uint8[32]
}

export interface IPacketHeader {
  type: number; // uint8, PacketType enum
  crc: number; // uint16
  len: number; // uint16
}

export interface INackPacket {
  ret: number; // int32
}

export interface IChunkAckPacket {
  state: number; // Represents the chunk_state (uint8)
  auxInfo: number; // Represents aux_info (uint32)
}
