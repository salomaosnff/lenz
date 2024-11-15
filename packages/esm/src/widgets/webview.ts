import { Widget } from "./widget.js";

export interface WebViewWidgetOptions {
  content: string | URL;
  base?: URL;
  themed?: boolean;
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
*,
::before,
::after {
  box-sizing: border-box; 
  border-width: 0; 
  border-style: solid; 
  border-color: var(--un-default-border-color, #e5e7eb); 
}

::before,
::after {
  --un-content: '';
}

html,
:host {
  line-height: 1.5; 
  -webkit-text-size-adjust: 100%; 
  -moz-tab-size: 4; 
  tab-size: 4; 
  font-family: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"; 
  font-feature-settings: normal; 
  font-variation-settings: normal; 
  -webkit-tap-highlight-color: transparent; 
}

body {
  margin: 0; 
  line-height: inherit; 
}

hr {
  height: 0; 
  color: inherit; 
  border-top-width: 1px; 
}

abbr:where([title]) {
  text-decoration: underline dotted;
}

h1,
h2,
h3,
h4,
h5,
h6 {
  font-size: inherit;
  font-weight: inherit;
}
a {
  color: inherit;
  text-decoration: inherit;
}

b,
strong {
  font-weight: bolder;
}

code,
kbd,
samp,
pre {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; 
  font-feature-settings: normal; 
  font-variation-settings: normal; 
  font-size: 1em; 
}

small {
  font-size: 80%;
}

sub,
sup {
  font-size: 75%;
  line-height: 0;
  position: relative;
  vertical-align: baseline;
}

sub {
  bottom: -0.25em;
}

sup {
  top: -0.5em;
}

table {
  text-indent: 0; 
  border-color: inherit; 
  border-collapse: collapse; 
}

button,
input,
optgroup,
select,
textarea {
  font-family: inherit; 
  font-feature-settings: inherit; 
  font-variation-settings: inherit; 
  font-size: 100%; 
  font-weight: inherit; 
  line-height: inherit; 
  color: inherit; 
  margin: 0; 
  padding: 0; 
}

button,
select {
  text-transform: none;
}

button,
[type='button'],
[type='reset'],
[type='submit'] {
  -webkit-appearance: button; 
  background-color: transparent; 
  background-image: none; 
}

:-moz-focusring {
  outline: auto;
}

:-moz-ui-invalid {
  box-shadow: none;
}

progress {
  vertical-align: baseline;
}
::-webkit-inner-spin-button,
::-webkit-outer-spin-button {
  height: auto;
}

[type='search'] {
  -webkit-appearance: textfield; 
  outline-offset: -2px; 
}

::-webkit-search-decoration {
  -webkit-appearance: none;
}

::-webkit-file-upload-button {
  -webkit-appearance: button; 
  font: inherit; 
}

summary {
  display: list-item;
}

blockquote,
dl,
dd,
h1,
h2,
h3,
h4,
h5,
h6,
hr,
figure,
p,
pre {
  margin: 0;
}

fieldset {
  margin: 0;
  padding: 0;
}

legend {
  padding: 0;
}

ol,
ul,
menu {
  list-style: none;
  margin: 0;
  padding: 0;
}

dialog {
  padding: 0;
}

textarea {
  resize: vertical;
}

input::placeholder,
textarea::placeholder {
  opacity: 1;
  color: #9ca3af; 
}

button,
[role="button"] {
  cursor: pointer;
}
:disabled {
  cursor: default;
}
img,
svg,
video,
canvas,
audio,
iframe,
embed,
object {
  display: block; 
  vertical-align: middle; 
}

img,
video {
  max-width: 100%;
  height: auto;
}
[hidden] {
  display: none;
}
  :root { ${variables} }

  .theme--dark {
    --color-primary: ${THEME.themes.dark.colors.primary};
    --color-secondary: ${THEME.themes.dark.colors.secondary};
    --color-background: ${THEME.themes.dark.colors.background};
    --color-foreground: ${THEME.themes.dark.colors.foreground};
    --color-surface: ${THEME.themes.dark.colors.surface};
    --color-surface2: ${THEME.themes.dark.colors.surface2};
    --color-danger: ${THEME.themes.dark.colors.danger};
    --color-warning: ${THEME.themes.dark.colors.warning};
    --color-info: ${THEME.themes.dark.colors.info};
    --color-success: ${THEME.themes.dark.colors.success};
    --color-muted: ${THEME.themes.dark.colors.muted};
  }
  
  * {
  accent-color: var(--color-primary)
  }
  
  html {
   font-size: 14px;
  }
  
  html, body {
    width: 100%;
    height: 100%;
    margin: 0;
    background: var(--color-background);
    color: var(--color-foreground);
    font-family: "BlinkMacSystemFont","Segoe UI","Roboto","Helvetica Neue","Open Sans","Segoe UI Emoji",ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"
  }
  
  ::-webkit-scrollbar {
    width: 10px;
  }
  
  ::-webkit-scrollbar-track {
    background: var(--color-background);
  }
  
  ::-webkit-scrollbar-thumb {
    background: var(--color-surface2);
    border-radius: 5px;
  }
  
  a {
    font-weight: bold;
  
    &:hover {
      text-decoration: underline;
    }
  }
  
  input:not([type="checkbox"]):not([type="radio"]), select, textarea {
    width: 100%;
    font: inherit;
    background: var(--color-surface);
    color: var(--color-foreground);
    border: 1px solid var(--color-surface2);
    padding: 0.25rem 0.5rem;
  
    &:focus {
      outline: 1px solid var(--color-primary);
    }
  }
  
  fieldset {
    border: 1px solid var(--color-surface2);
    padding: 0.5rem;
    & legend {
      font-weight: bold;
      padding: 0 0.25rem;
    }
  }
  
  .separator {
    width: 100%;
    height: 1px;
    background: linear-gradient(
      to right,
      transparent 0%,
      var(--color-surface2) 50%,
      transparent 100%
    );
    margin: 0.5rem 0;
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

async function toDocument(options: WebViewWidgetOptions): Promise<Document> {
  const content =
    typeof options.content === "string"
      ? options.content
      : await fetch(options.content).then((res) => res.text());
  const importmap = document.head.querySelector("script[type=importmap]");
  const iframeDocument = new DOMParser().parseFromString(content, "text/html");

  // set origin
  iframeDocument.documentElement.setAttribute("data-origin", window.origin);

  const existingImportmap = iframeDocument.head.querySelector(
    "script[type=importmap]"
  );

  if (options.themed) {
    iframeDocument.documentElement.classList.add("theme--dark");
    iframeDocument.head.prepend(style.cloneNode(true));
  }

  if (existingImportmap) {
    const currentContent = JSON.parse(existingImportmap.textContent ?? "{}");
    const contentToMerge = JSON.parse(importmap?.textContent ?? "{}");

    Object.assign(currentContent.imports, contentToMerge.imports);

    existingImportmap.textContent = JSON.stringify(currentContent);
  } else if (importmap) {
    iframeDocument.head.prepend(importmap?.cloneNode(true));
  }

  if (options.base) {
    const baseElement = document.createElement("base");
    baseElement.href = options.base.href;
    iframeDocument.head.prepend(baseElement);

    const setOriginScript = document.createElement("script");

    setOriginScript.textContent = `
        window.origin = "${options.base.protocol}//${options.base.host}";
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
        : `${options.base.href.replace(/\/+$/, "")}/${src.replace(/^\/+/, "")}`;

      if (el.tagName === "SCRIPT" || el.tagName === "IMG") {
        el.setAttribute("src", normalizedSrc);
      } else if (el.tagName === "LINK") {
        el.setAttribute("href", normalizedSrc);
      }
    }
  }

  return iframeDocument;
}

// export class WebViewWidget implements Widget {
//   #options: WebViewWidgetOptions;
//   iframe: HTMLIFrameElement;

//   constructor(options: WebViewWidgetOptions) {
//     this.#options = options;
//     this.iframe = document.createElement("iframe");
//     this.iframe.style.width = "100%";
//     this.iframe.style.height = "100%";
//   }

//   load(contentOrUrl: string | URL): Promise<void> {
//     return new Promise<void>(async (resolve, reject) => {
//       const content = await toDocument({
//         ...this.#options,
//         content: contentOrUrl,
//       });

//       this.iframe.addEventListener("load", () => resolve(), { once: true });
//       this.iframe.addEventListener("error", (e) => reject(e), { once: true });

//       this.iframe.srcdoc = content.documentElement.outerHTML;
//     });
//   }

//   setup(): void {
//     if (this.#options.content) {
//       this.load(this.#options.content);
//     }
//   }

//   render(): HTMLElement {
//     return this.iframe;
//   }
// }
