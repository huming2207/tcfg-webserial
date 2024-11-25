import { Parser } from "binary-parser";

export const PacketHeader = new Parser().endianess("little").uint8("type").uint16("crc").uint16("len");
