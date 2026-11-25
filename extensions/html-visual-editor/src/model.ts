/** Tags that can hold other elements: inserting while one is selected adds inside it. */
export const containerTags = new Set([
  "body",
  "div",
  "section",
  "article",
  "main",
  "header",
  "footer",
  "nav",
  "aside",
  "form",
  "ul",
  "ol",
]);

export const placeholderImage =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='180'><rect width='100%' height='100%' fill='%23d4d4d8'/><text x='50%' y='50%' fill='%2371717a' font-family='sans-serif' font-size='16' text-anchor='middle' dy='.3em'>Imagem</text></svg>";

export interface PaletteItem {
  id: string;
  label: string;
  icon: string;
  html: string;
}

export const palette: PaletteItem[] = [
  { id: "heading", label: "Título", icon: "lucide:heading-1", html: "<h1>Título</h1>" },
  { id: "text", label: "Texto", icon: "lucide:pilcrow", html: "<p>Escreva seu texto aqui.</p>" },
  {
    id: "button",
    label: "Botão",
    icon: "lucide:mouse-pointer-click",
    html: '<button style="padding:8px 16px;border:0;border-radius:6px;background:#8b5cf6;color:#fff">Botão</button>',
  },
  { id: "link", label: "Link", icon: "lucide:link", html: '<a href="#">Link</a>' },
  {
    id: "image",
    label: "Imagem",
    icon: "lucide:image",
    html: `<img src="${placeholderImage}" alt="Imagem" style="max-width:100%">`,
  },
  {
    id: "container",
    label: "Container",
    icon: "lucide:square",
    html: '<div style="padding:16px;border:1px dashed #a1a1aa"></div>',
  },
  {
    id: "list",
    label: "Lista",
    icon: "lucide:list",
    html: "<ul><li>Item 1</li><li>Item 2</li></ul>",
  },
];

/** Wraps a fragment into a document for the canvas. Full documents are used as they are. */
export function buildDocument(content: string) {
  if (/<html[\s>]/i.test(content)) return content;
  return `<!doctype html><html data-lenz-fragment><head><meta charset="utf-8"><style>body{margin:0;padding:16px;font-family:system-ui,sans-serif;color:#18181b}</style></head><body>${content}</body></html>`;
}

/**
 * Whether the canvas is a fragment the editor wrapped (see `buildDocument`): only its `body` is
 * written back to the file, so anything in its `head` is lost.
 */
export const isFragmentCanvas = (doc: Document) =>
  doc.documentElement.hasAttribute("data-lenz-fragment");

export const isFullDocument = (content: string) => /<html[\s>]/i.test(content);

/** The file content for the current state of the canvas, without editor-only attributes. */
export function serialize(doc: Document, fullDocument: boolean) {
  const root = doc.documentElement.cloneNode(true) as HTMLElement;
  root.querySelectorAll("[contenteditable]").forEach((el) => el.removeAttribute("contenteditable"));
  return fullDocument
    ? `<!doctype html>\n${root.outerHTML}\n`
    : `${root.querySelector("body")!.innerHTML.trim()}\n`;
}

/** `tag#id.class`, for the layers panel. */
export function describe(el: Element) {
  const id = el.id ? `#${el.id}` : "";
  const cls = el.classList[0] ? `.${el.classList[0]}` : "";
  return `${el.tagName.toLowerCase()}${id}${cls}`;
}
