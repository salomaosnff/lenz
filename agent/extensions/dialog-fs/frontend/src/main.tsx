/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference path="/usr/share/lenz/resources/types/index.d.ts" />
import "@unocss/reset/tailwind.css";
import "uno.css";

import { onUiInit } from "lenz:ui";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

onUiInit(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
