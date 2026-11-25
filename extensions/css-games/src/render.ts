import { FORBIDDEN_CSS, HEIGHT, WIDTH, rewriteSelector } from "./pixels";

/** The tags the player may use: shapes and text, nothing that loads or runs anything. */
const TAGS = new Set([
  "div",
  "span",
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "section",
  "article",
  "header",
  "footer",
  "main",
  "nav",
  "aside",
  "b",
  "i",
  "u",
  "em",
  "strong",
  "small",
  "br",
  "hr",
  "pre",
  "code",
  "blockquote",
  "button",
  "label",
  "a",
  "table",
  "thead",
  "tbody",
  "tr",
  "td",
  "th",
]);
const ATTRIBUTES = new Set(["class", "id", "title", "style"]);

export interface Built {
  /** The picture, as an SVG text. */
  svg: string;
  /** What was left out, for the player to know. */
  notes: string[];
}

/** HTML of the player: only the tags and attributes allowed, written back as XHTML. */
function cleanHtml(html: string, notes: Set<string>): string {
  // `DOMParser` makes an inert document: nothing in it loads or runs.
  const doc = new DOMParser().parseFromString(`<!doctype html><body>${html}</body>`, "text/html");
  const clean = (parent: Element) => {
    for (const el of Array.from(parent.children)) {
      if (!TAGS.has(el.localName)) {
        notes.add(`A tag <${el.localName}> não é permitida.`);
        el.remove();
        continue;
      }
      for (const attr of Array.from(el.attributes)) {
        if (!ATTRIBUTES.has(attr.name)) el.removeAttribute(attr.name);
        else if (attr.name === "style" && FORBIDDEN_CSS.test(attr.value)) {
          notes.add("Imagens e `url()` não são permitidas.");
          el.removeAttribute("style");
        }
      }
      clean(el);
    }
  };
  clean(doc.body);
  const serializer = new XMLSerializer();
  return Array.from(doc.body.childNodes, (node) => serializer.serializeToString(node)).join("");
}

/** CSS of the player: the style rules only, with `body` standing for the scene. */
function cleanCss(css: string, notes: Set<string>): string {
  const sheet = new CSSStyleSheet();
  try {
    sheet.replaceSync(css);
  } catch {
    return "";
  }
  const rules: string[] = [];
  for (const rule of Array.from(sheet.cssRules)) {
    if (!(rule instanceof CSSStyleRule)) {
      notes.add("Só regras de estilo comuns são aceitas (sem @media, @import...).");
    } else if (FORBIDDEN_CSS.test(rule.cssText)) {
      notes.add("Imagens e `url()` não são permitidas.");
    } else {
      rules.push(`${rewriteSelector(rule.selectorText)} { ${rule.style.cssText} }`);
    }
  }
  return rules.join("\n");
}

const escapeXml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * What the scene starts as, before the player's CSS. The scene is not a `div`, so the `div` rules
 * of the player never reach it, and the stylesheet is not inside it, so it does not count in
 * `:nth-child()`.
 */
const SCENE = `#cena { display: block; position: relative; width: ${WIDTH}px; height: ${HEIGHT}px; margin: 0; padding: 0; overflow: hidden; background: #fff; color: #000; font: 16px sans-serif; }`;

/**
 * The picture of a page: a 400×300 scene inside an SVG. An SVG used as an image cannot run
 * scripts or load anything, so what the player writes stays inside the picture.
 */
export function buildSvg(html: string, css: string): Built {
  const notes = new Set<string>();
  const body = cleanHtml(html, notes);
  const style = `${SCENE}\n${cleanCss(css, notes)}`;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">` +
    `<foreignObject width="${WIDTH}" height="${HEIGHT}">` +
    `<style xmlns="http://www.w3.org/1999/xhtml">${escapeXml(style)}</style>` +
    `<x-cena xmlns="http://www.w3.org/1999/xhtml" id="cena">${body}</x-cena>` +
    `</foreignObject></svg>`;
  return { svg, notes: [...notes] };
}

export const toUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

/** Loads the picture and reads its pixels. `undefined` pixels when the browser will not let us. */
export async function rasterize(url: string): Promise<Uint8ClampedArray | undefined> {
  const img = new Image();
  img.src = url;
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return undefined;
  ctx.drawImage(img, 0, 0);
  try {
    return ctx.getImageData(0, 0, WIDTH, HEIGHT).data;
  } catch {
    return undefined; // the canvas is tainted: this browser does not allow reading it
  }
}
