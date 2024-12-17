import { AssignmentTurnedIn, Build, Fingerprint, Memory } from "@mui/icons-material";
import { Card, CardContent, Typography, Avatar, List, ListItem, ListItemAvatar, ListItemText } from "@mui/material";
import React from "react";
import { useSnapshot } from "valtio";
import { SerialPortState } from "../states/SerialPortState";

export const DeviceInfoView = (): JSX.Element => {
  const deviceSnap = useSnapshot(SerialPortState);

  return (
    <>
      {deviceSnap.connected ? (
        <List sx={{ width: "100%", maxWidth: 600, bgcolor: "background.paper" }}>
          <ListItem>
            <ListItemAvatar>
              <Avatar>
                <AssignmentTurnedIn />
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary="Model name" secondary={deviceSnap.devInfo?.modelName || "Unknown"} />
          </ListItem>
          <ListItem>
            <ListItemAvatar>
              <Avatar>
                <Fingerprint />
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary="Serial number" secondary={deviceSnap.devInfo?.macAddr || "Unknown"} />
          </ListItem>
          <ListItem>
            <ListItemAvatar>
              <Avatar>
                <Build />
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary="Firmware version" secondary={deviceSnap.devInfo?.firmwareVer || "Unknown"} />
          </ListItem>
          <ListItem>
            <ListItemAvatar>
              <Avatar>
                <Memory />
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary="SDK version" secondary={deviceSnap.devInfo?.sdkVer || "Unknown"} />
          </ListItem>
        </List>
      ) : (
        <Card sx={{ minWidth: 275 }}>
          <CardContent>
            <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
              Oops...
            </Typography>
            <Typography variant="h5" component="div">
              Device disconnected
            </Typography>
            <Typography variant="body2">Click the USB button at the bottom-left corner to start</Typography>
          </CardContent>
        </Card>
      )}
    </>
  );
};
