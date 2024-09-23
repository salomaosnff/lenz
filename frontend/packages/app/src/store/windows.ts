import _uniqueId from "lodash-es/uniqueId";
import { defineStore } from "pinia";
import { reactive } from "vue";

export interface WindowOptions {
  title?: string;
  content?: string | URL;
  base?: URL;
  width?: number;
  height?: number;
  themed?: boolean;
  data?: Record<string, unknown>;
  position?: { x: number; y: number };
  resizable?: boolean;
  borderless?: boolean;
  modal?: boolean;
  closable?: boolean;
  movable?: boolean;
}

export interface WindowInstance {
  id: string;
  options: WindowOptions & Required<Omit<WindowOptions, "base" | "content">>;

  setContent(source: string | URL): void;
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

function parseContent(
  content: string,
  options: WindowOptions,
  base = options.base
) {
  const importmap = document.head.querySelector("script[type=importmap]");
  const iframeDocument = new DOMParser().parseFromString(content, "text/html");

  // set origin
  iframeDocument.documentElement.setAttribute("data-origin", window.origin);

  const existingImportmap = iframeDocument.head.querySelector(
    "script[type=importmap]"
  );

  if (options.themed) {
    iframeDocument.documentElement.classList.add("theme--dark");
    iframeDocument.head.appendChild(style.cloneNode(true));
  }

  if (existingImportmap) {
    const currentContent = JSON.parse(existingImportmap.textContent ?? "{}");
    const contentToMerge = JSON.parse(importmap?.textContent ?? "{}");

    Object.assign(currentContent.imports, contentToMerge.imports);

    existingImportmap.textContent = JSON.stringify(currentContent);
  } else if (importmap) {
    iframeDocument.head.prepend(importmap?.cloneNode(true));
  }

  if (base) {
    const baseElement = document.createElement("base");
    baseElement.href = base.href;
    iframeDocument.head.prepend(baseElement);

    const setOriginScript = document.createElement("script");

    setOriginScript.textContent = `
      window.origin = "${base.protocol}//${base.host}";
    `;

    iframeDocument.head.prepend(setOriginScript);

    for (const el of iframeDocument.querySelectorAll(
      "script[src], link[href], img[src]"
    )) {
      const src = (
        el.getAttribute("src") ??
        el.getAttribute("href") ??
        ""
      ).replace(/^\.\/*/, "");
      const normalizedSrc = src.startsWith("http")
        ? src
        : `${base.href.replace(/\/+$/, "")}/${src.replace(/^\/+/, "")}`;

      if (el.tagName === "SCRIPT" || el.tagName === "IMG") {
        el.setAttribute("src", normalizedSrc);
      } else if (el.tagName === "LINK") {
        el.setAttribute("href", normalizedSrc);
      }
    }
  }

  return iframeDocument;
}

export const useWindowStore = defineStore("window", () => {
  const windowsMap = reactive(new Map<string, WindowInstance>());

  function createWindow(options: WindowOptions): WindowInstance {
    const id = _uniqueId("window-");
    const { content, ...rest } = options;
    const normalizedOptions = reactive({
      title: "Window",
      width: 600,
      height: 400,
      position: { x: 0, y: 0 },
      borderless: false,
      data: {},
      closable: true,
      content: "",
      modal: false,
      movable: true,
      resizable: true,
      themed: true,
      ...rest,
    });

    async function setContent(content: string | URL, base?: URL) {
      if (content instanceof URL) {
        return setContent(
          await fetch(content).then((res) => res.text()),
          base ?? content
        );
      }
      normalizedOptions.content = parseContent(
        content,
        options,
        base
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

    function close() {
      windowsMap.delete(id);
    }

    const instance: WindowInstance = {
      id,
      options: normalizedOptions,
      center,
      close,
      setContent,
      setPosition,
      setSize,
    };

    instance.setContent(content || "");

    windowsMap.set(id, instance);

    return instance;
  }

  return {
    createWindow,
    windowsMap,
  };
});
