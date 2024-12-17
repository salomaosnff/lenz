import "./style.scss";

import { LenzDisposer } from "lenz:types";
import { createApp } from "vue";

import App from "./App.vue";

// if (import.meta.env.DEV) {
if (false) {
  const app = createApp(App, {
    getFonts() {
      return document.fonts.ready.then((value) =>
        Array.from(value.values(), ({ family }) => family)
      );
    },
    getGoogleFontsUrls() {
      return Array.from(
        document.querySelectorAll(
          "link[rel=stylesheet][href^='https://fonts.googleapis.com/css']"
        )
      ).map(({ href }: any) => href);
    },
    getSelection() {
      return document.createElement("selection");
    },
    onUpdateGoogleFontsUrls(fonts: string[]) {
      console.log("onUpdateGoogleFontsUrls", fonts);
    },
    onUpdateStyles(styles: Partial<CSSStyleDeclaration>) {
      console.log("onUpdateStyles", styles);
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
    getFonts() {
      return data
        .getCurrentDocument()
        .fonts.ready.then((value: FontFaceSet) =>
          Array.from(
            new Set(Array.from(value.values(), ({ family }) => family))
          )
        );
    },
    getGoogleFontsUrls() {
      return data
        .getCurrentDocument()
        .querySelectorAll(
          "link[rel=stylesheet][href^='https://fonts.googleapis.com/css']"
        )
        .map(({ href }: HTMLLinkElement) => href);
    },
    getSelection() {
      return data.selection.value?.map((selection) => selection.element);
    },
    onUpdateGoogleFontsUrls(fonts: string[]) {
      data
        .getCurrentDocument()
        .queryAll(
          "link[rel=stylesheet][href^='https://fonts.googleapis.com/css']"
        )
        .forEach((link: HTMLLinkElement) => link.remove());

      fonts.forEach((href) => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        document.head.appendChild(link);
      });
    },
    onUpdateStyles(styles: Partial<CSSStyleDeclaration>) {
      for (const [key, value] of Object.entries(styles)) {
        data.selection.value.forEach(({ element }) => {
          console.log("set", element, key, value);
          element.style.setProperty(key, value);
        });
      }
    },
  });

  const disposeStyle = injectStyle();

  app.mount(parent);

  return () => {
    app.unmount();
    disposeStyle();
  };
}
