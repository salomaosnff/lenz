import "./style.scss";

import { LenzDisposer } from "lenz:types";
import { createApp } from "vue";

import App from "./App.vue";

if (import.meta.env.DEV) {
  const app = createApp(App, {
    onInsert(d: string) {
      console.log("insert", d);
    },
  });

  app.mount(document.body);
}

let countInjects = 0;

const link = document.createElement("link");

const styleUrl = import.meta.url.replace(/[^/]+$/g, "style.css");

link.rel = "stylesheet";
link.href = styleUrl;
link.id = "widget-layout-style";

function injectStyle(): LenzDisposer {
  if (countInjects++ === 0) {
    document.head.appendChild(link);
  }

  return () => {
    if (--countInjects === 0) {
      link.remove();
    }
  };
}

export default function (parent: HTMLElement, data: any) {
  const app = createApp(App, {
    onInsert: data.onInsert,
  });

  const disposeStyle = injectStyle();

  app.mount(parent);

  return () => {
    app.unmount();
    disposeStyle();
  };
}
