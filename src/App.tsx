import { Container } from "@mui/material";
import React from "react";
import { BottomBar } from "./components/bottomBar";
import { MainView } from "./components/mainView";

export function App() {
  return (
    <Container>
      <BottomBar />
      <MainView />
    </Container>
  );
}
