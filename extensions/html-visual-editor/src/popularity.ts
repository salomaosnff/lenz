/**
 * The elements people reach for most, most used first. It is the starting order of the elements
 * view; what the user inserts moves up from there (see `compareUse`).
 */
export const COMMON_TAGS = [
  "div",
  "p",
  "a",
  "img",
  "span",
  "h1",
  "h2",
  "h3",
  "button",
  "ul",
  "li",
  "input",
  "section",
  "header",
  "footer",
  "nav",
  "form",
  "label",
  "h4",
  "ol",
  "table",
  "tr",
  "td",
  "th",
  "textarea",
  "select",
  "option",
  "main",
  "article",
  "aside",
  "strong",
  "em",
  "br",
  "hr",
  "video",
  "audio",
  "iframe",
  "svg",
  "canvas",
  "h5",
  "h6",
  "thead",
  "tbody",
  "blockquote",
  "pre",
  "code",
  "small",
  "figure",
  "figcaption",
  "details",
  "summary",
  "fieldset",
  "legend",
  "picture",
  "dl",
  "dt",
  "dd",
  "b",
  "i",
  "u",
  "s",
  "mark",
  "sub",
  "sup",
  "time",
  "address",
  "abbr",
  "cite",
  "q",
  "kbd",
  "progress",
  "meter",
  "dialog",
  "template",
  "script",
  "style",
];

const position = new Map(COMMON_TAGS.map((tag, index) => [tag, index]));

/** How many times each tag was inserted. */
export type UseCounts = Record<string, number>;

/**
 * Orders tags for the view: the ones the user inserted most come first, then the common ones in
 * their order, then every other, which the caller keeps in its own order (this returns 0).
 */
export function compareUse(counts: UseCounts) {
  return (a: string, b: string) => {
    const used = (counts[b] ?? 0) - (counts[a] ?? 0);
    if (used) return used;
    return (position.get(a) ?? Infinity) - (position.get(b) ?? Infinity) || 0;
  };
}

const KEY = "lenz:html-visual-editor:element-use";

export function loadUse(): UseCounts {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    return saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
  } catch {
    return {};
  }
}

export function saveUse(counts: UseCounts) {
  try {
    localStorage.setItem(KEY, JSON.stringify(counts));
  } catch {
    // Storage may be blocked: the order then lasts until the page closes.
  }
}
