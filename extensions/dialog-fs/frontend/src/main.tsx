import "@unocss/reset/tailwind.css";
import "uno.css";
import "./index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import OpenFile, { AppData } from "./components/OpenFile";

let countInjects = 0;

const link = document.createElement("link");

const styleUrl = import.meta.url.replace(/[^/]+$/g, "style.css");

link.rel = "stylesheet";
link.href = styleUrl;
link.id = "widget-color-style";

function injectStyle() {
  if (countInjects++ === 0) {
    document.head.appendChild(link);
  }

  return () => {
    if (--countInjects === 0) {
      link.remove();
    }
  };
}

export function OpenFileDialog(element: HTMLElement, data: AppData) {
  const removeStyle = injectStyle();

  const app = createRoot(element);

  app.render(
    <StrictMode>
      <OpenFile getData={() => data} />
    </StrictMode>
  );

  return () => {
    removeStyle();
    app.unmount();
  };
}

export function SaveFileDialog(element: HTMLElement, data: AppData) {
  const removeStyle = injectStyle();

  const app = createRoot(element);

  app.render(
    <StrictMode>
      <OpenFile getData={() => data} save />
    </StrictMode>
  );

  return () => {
    removeStyle();
    app.unmount();
  };
}
