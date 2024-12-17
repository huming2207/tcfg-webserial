import { Box, Container, Tab, Tabs } from "@mui/material";
import React, { useState } from "react";
import { DeviceInfoView } from "./deviceInfoView";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div role="tabpanel" hidden={value !== index} id={`simple-tabpanel-${index}`} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const MainView = (): JSX.Element => {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <>
      <Container>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={value} onChange={handleChange}>
            <Tab label="Device Info" />
            <Tab label="Configuration" />
          </Tabs>
        </Box>
        <TabPanel value={value} index={0}>
          <DeviceInfoView />
        </TabPanel>
        <TabPanel value={value} index={1}></TabPanel>
      </Container>
    </>
  );
};
