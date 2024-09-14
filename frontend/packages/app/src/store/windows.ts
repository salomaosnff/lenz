import _uniqueId from "lodash-es/uniqueId";
import { defineStore } from "pinia";
import { reactive } from "vue";
import { WebviewChannel } from "../components/AppWebview/types";

export interface WindowOptions {
  title?: string;
  content?: string;
  width?: number;
  height?: number;
  themed?: boolean;
  channels?: Record<string, WebviewChannel<unknown>>;
  position?: { x: number; y: number };
  resizable?: boolean;
  borderless?: boolean;
  modal?: boolean;
  closable?: boolean;
  movable?: boolean;
}

export interface WindowInstance {
  id: string;
  options: Required<WindowOptions>;

  setContent(source: string): void;
  setPosition(x: number, y: number): void;
  setSize(width: number, height: number): void;
  center(): void;
  close(): void;
}

const THEME: any = {
  variables: {
    "theme-surface-opacity": "25%",
    "color-surface-primary":
      "oklch(from var(--color-primary) l c h / var(--theme-surface-opacity))",
    "color-surface-danger":
      "oklch(from var(--color-danger) l c h / var(--theme-surface-opacity))",
    "color-surface-warning":
      "oklch(from var(--color-warning) l c h / var(--theme-surface-opacity))",
    "color-surface-info":
      "oklch(from var(--color-info) l c h / var(--theme-surface-opacity))",
    "color-surface-error": "var(--color-surface-danger)",
    "current-color": "var(--color-primary)",
    "current-surface-color":
      "oklch(from var(--current-color) l c h / var(--theme-surface-opacity))",
  },
  themes: {
    light: {
      colors: {
        primary: "#4A90E2",
        secondary: "#BD10E0",
        background: "#F5F7FA",
        foreground: "#000000",
        surface: "#FFFFFF",
        surface2: "#F2F2F2",

        danger: "#D0021B",
        warning: "#F8A532",
        info: "#50E3C2",
        success: "#7ED321",
        muted: "#9B9B9B",
      },
    },
    dark: {
      colors: {
        primary: "#4A90E2",
        secondary: "#BD10E0",
        background: "#121212",
        foreground: "#E0E0E0",
        surface: "#1E1E1E",
        surface2: "#333333",

        danger: "#FF5C5C",
        warning: "#FFA726",
        info: "#4FC3F7",
        success: "#66BB6A",
        muted: "#757575",
      },
    },
  },
};

const style = document.createElement("style");

const variables = Object.entries(THEME.variables)
  .map(([key, value]) => {
    return `--${key}: ${value};`;
  })
  .join("\n");

let content = `
:root { ${variables} }
html, body {
  width: 100%;
  height: 100%;
  margin: 0;
  background: var(--color-background);
  color: var(--color-foreground);
  font-family: "BlinkMacSystemFont","Segoe UI","Roboto","Helvetica Neue","Open Sans","Segoe UI Emoji",ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"
}
`;

content += Object.entries(THEME.themes)
  .map(([theme, { variables = {}, colors = {} }]: any) => {
    let content = Object.entries(variables)
      .map(([key, value]) => `--${key}: ${value};`)
      .join("\n");
    content += Object.entries(colors)
      .map(([key, value]) => `--color-${key}: ${value};`)
      .join("\n");

    return `.theme--${theme} { ${content} }`;
  })
  .join("\n");

style.textContent = content;

function parseContent(content: string, options: WindowOptions) {
  const importmap = document.head.querySelectorAll("script[type=importmap]");
  const iframeDocument = new DOMParser().parseFromString(content, "text/html");

  if (options.themed) {
    iframeDocument.documentElement.classList.add("theme--dark");
    iframeDocument.head.appendChild(style.cloneNode(true));
  }

  iframeDocument.head.prepend(
    ...Array.from(importmap).map((script) => script.cloneNode(true))
  );

  return iframeDocument;
}

export const useWindowStore = defineStore("window", () => {
  const windowsMap = reactive(new Map<string, WindowInstance>());

  function createWindow(options: WindowOptions): WindowInstance {
    const id = _uniqueId("window-");
    const normalizedOptions = reactive<Required<WindowOptions>>({
      title: "Window",
      width: 600,
      height: 400,
      position: { x: 0, y: 0 },
      borderless: false,
      channels: {},
      closable: true,
      content: "",
      modal: false,
      movable: true,
      resizable: true,
      themed: true,
      ...options,
    });

    function setContent(content: string) {
      normalizedOptions.content = parseContent(
        content,
        options
      ).documentElement.outerHTML;
    }

    function setSize(width: number, height: number) {
      normalizedOptions.width = width;
      normalizedOptions.height = height;
    }

    function setPosition(x: number, y: number) {
      normalizedOptions.position = { x, y };
    }

    function center() {
      const { innerWidth, innerHeight } = window;
      const { width, height } = normalizedOptions;

      setPosition((innerWidth - width) / 2, (innerHeight - height) / 2);
    }

    const instance = {
      id,
      options: normalizedOptions,
      center,
      close,
      setContent,
      setPosition,
      setSize,
    };

    instance.setContent(options.content || "");

    windowsMap.set(id, instance);

    return instance;
  }

  return {
    createWindow,
    windowsMap,
  };
});
