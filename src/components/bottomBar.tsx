import { UsbOffRounded, UsbRounded } from "@mui/icons-material";
import { AppBar, IconButton, Toolbar, Typography } from "@mui/material";
import React from "react";
import { useSnapshot } from "valtio";
import { SerialPortState } from "../states/SerialPortState";
import { SerialManager } from "../helpers/SerialPort";

export const BottomBar = (): JSX.Element => {
  const deviceSnap = useSnapshot(SerialPortState);
  console.log(`Device: ${deviceSnap.connected}`);

  return (
    <>
      <AppBar position="fixed" color="primary" sx={{ top: "auto", bottom: 0 }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {"Device: " + (deviceSnap.connected ? "connected" : "disconnected")}
          </Typography>
          <IconButton
            size="large"
            color="inherit"
            onClick={async () => {
              if (!deviceSnap.connected) {
                await SerialManager.open(115200);
              } else {
                await SerialManager.close();
              }
            }}
          >
            {deviceSnap.connected ? <UsbRounded /> : <UsbOffRounded />}
          </IconButton>
        </Toolbar>
      </AppBar>
    </>
  );
};
