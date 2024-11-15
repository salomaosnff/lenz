import "uno.css";
import { createApp, markRaw } from "vue";

import * as LenzReactivity from "lenz:reactivity";

import ColorPickerApp from "./ColorPickerApp.vue";
import ThemeEditor from "./ThemeEditor.vue";

export function themeEditor(parent: HTMLElement, data: any) {
  const link = document.createElement("link");

  const styleUrl = import.meta.url.replace(/[^/]+$/g, "style.css");

  link.rel = "stylesheet";
  link.href = styleUrl;
  link.id = "widget-color-style";

  document.head.appendChild(link);

  const app = createApp(ThemeEditor, {
    getData: () => markRaw(data),
  });

  app.mount(parent);

  return () => {
    app.unmount();
    link.remove();
  };
}

export function colorPicker(parent: HTMLElement, data: any) {
  const link = document.createElement("link");

  const styleUrl = import.meta.url.replace(/[^/]+$/g, "style.css");

  link.rel = "stylesheet";
  link.href = styleUrl;
  link.id = "widget-color-style";

  document.head.appendChild(link);

  const app = createApp(ColorPickerApp, {
    getData: () => markRaw(data),
  });

  app.mount(parent);

  return () => {
    app.unmount();
    link.remove();
  };
}


if (import.meta.env.DEV) {
  const root = document.getElementById("app")!;

  colorPicker(root, {
    result: LenzReactivity.ref(""),
  });
}