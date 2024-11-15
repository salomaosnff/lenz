import "@unocss/reset/tailwind.css";
import "uno.css";
import "./index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import OpenFile, { AppData } from './components/OpenFile';

export function FileDialog(element: HTMLElement, data: AppData) {
  const link = document.createElement("link");

  const styleUrl = import.meta.url.replace(/[^/]+$/g, "style.css");

  link.rel = "stylesheet";
  link.href = styleUrl;
  link.id = "widget-color-style";

  document.head.appendChild(link);

  const app = createRoot(element);

  app.render(
    <StrictMode>
      <OpenFile getData={() => data} />
    </StrictMode>
  );

  return () => {
    link.remove();
    app.unmount();
  }
}