import { proxy } from "valtio";

export interface SerialPortStateInfo {
  connected: boolean;
}

export const SerialPortState = proxy({
  connected: false,
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
