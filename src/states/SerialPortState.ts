import { proxy } from "valtio";
import { IDeviceInfoPacket } from "../schema/packet";

export interface SerialPortStateInfo {
  connected: boolean;
  devInfo?: IDeviceInfoPacket;
}

export const SerialPortState = proxy({
  connected: false,
  devInfo: undefined,
} as SerialPortStateInfo);

export const addSerialStateCallback = () => {
  navigator.serial.addEventListener("connect", () => {
    console.log("WebSerial: connected");
    SerialPortState.connected = true;
  });

  navigator.serial.addEventListener("disconnect", () => {
    console.log("WebSerial: disconnected");
    SerialPortState.connected = false;
  });
};
