// What an agent may put in the page. The page is the user's work, and what the agent writes into it
// outlives the session (it is saved in the file and opened elsewhere), so what could run code, or
// load something behind the user's back, is refused here instead of being cleaned up later.

/** Tags that run code or change how the whole page loads. */
const BLOCKED_TAGS = new Set(["script", "base", "object", "embed"]);

/** Attributes that hold an address. */
const URL_ATTRIBUTES = new Set([
  "href",
  "src",
  "action",
  "formaction",
  "poster",
  "data",
  "xlink:href",
]);

/** Tags that cannot hold anything. */
export const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "source",
  "track",
  "wbr",
]);

export interface AttributeLike {
  name: string;
  value: string;
}

/** A tag name that is valid HTML, in lowercase. Throws on one that is not, or that is blocked. */
export function checkTag(tag: string): string {
  const name = tag.trim().toLowerCase();
  if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name))
    throw new Error(`"${tag}" is not a valid tag name.`);
  if (BLOCKED_TAGS.has(name)) throw new Error(`The tag <${name}> cannot be added by an agent.`);
  return name;
}

/** Throws on a name that cannot be an attribute. Taking an attribute away needs no more than this. */
export function checkAttributeName(name: string): void {
  if (!/^[a-zA-Z_:][-a-zA-Z0-9_:.]*$/.test(name))
    throw new Error(`"${name}" is not a valid attribute name.`);
}

/** Throws when an attribute could run code (event handlers, `javascript:` addresses, `srcdoc`). */
export function checkAttribute(name: string, value: string): void {
  checkAttributeName(name);
  const lower = name.toLowerCase();
  if (lower.startsWith("on")) {
    throw new Error(`The attribute "${name}" is an event handler, which an agent cannot add.`);
  }
  if (lower === "srcdoc") throw new Error('The attribute "srcdoc" cannot be set by an agent.');
  // Browsers ignore whitespace and control characters inside the scheme: `java\nscript:`.
  const address = value.replace(/[\p{Cc}\s]/gu, "").toLowerCase();
  if (URL_ATTRIBUTES.has(lower) && /^(javascript|vbscript):/.test(address)) {
    throw new Error(`The address in "${name}" would run code.`);
  }
}

/** Checks the element a fragment of HTML makes: its tag and every attribute it came with. */
export function checkElement(tag: string, attributes: Iterable<AttributeLike>): void {
  checkTag(tag);
  for (const { name, value } of attributes) checkAttribute(name, value);
}

/** `backgroundColor` → `background-color`; custom properties (`--x`) are left as they are. */
export function toKebab(property: string): string {
  const name = property.trim();
  if (name.startsWith("--")) return name;
  if (name === "cssFloat") return "float";
  return name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

/** A CSS property name, kebab-cased. Throws on anything that is not one. */
export function checkProperty(property: string): string {
  const name = toKebab(property);
  if (!/^(--[a-zA-Z0-9_-]+|-?[a-z][a-z0-9-]*)$/.test(name)) {
    throw new Error(`"${property}" is not a CSS property.`);
  }
  return name;
}

/** `red !important` → `red` and `"important"`. */
export function splitImportant(value: string): { value: string; priority: "important" | "" } {
  const match = /^(.*?)\s*!\s*important\s*$/is.exec(value);
  return match
    ? { value: match[1]!.trim(), priority: "important" }
    : { value: value.trim(), priority: "" };
}

/** Throws when a value could pull in code or end the declaration it is in. */
export function checkValue(property: string, value: string): void {
  if (/[{}]/.test(value) || /;/.test(value.replace(/(['"]).*?\1|\([^)]*\)/g, ""))) {
    throw new Error(`The value of "${property}" is not a single CSS value.`);
  }
  if (/expression\s*\(|javascript:|vbscript:|@import/i.test(value)) {
    throw new Error(`The value of "${property}" is not allowed.`);
  }
}

/** A selector as an agent writes it. It is parsed by the browser: this keeps it to one rule. */
export function checkSelector(selector: string): string {
  const text = selector.trim();
  if (!text) throw new Error("The selector is empty.");
  if (
    /[{};@<>]/.test(text.replace(/\[[^\]]*\]|\([^)]*\)|(['"]).*?\1/g, "").replace(/\s*>\s*/g, " "))
  ) {
    throw new Error(`"${selector}" is not a single selector.`);
  }
  return text;
}

/** The condition of a media query (`(max-width: 600px)`), kept to one query list. */
export function checkMedia(media: string): string {
  const text = media.trim().replace(/^@media\s+/i, "");
  if (!text || /[{};@<]/.test(text)) throw new Error(`"${media}" is not a media query.`);
  return text;
}

/** The widths to capture: whole numbers a page can have, no repeats, at most `limit` of them. */
export function checkWidths(value: unknown, fallback: number[], limit = 4): number[] {
  if (value === undefined) return fallback;
  if (!Array.isArray(value) || !value.length)
    throw new Error('"widths" must be a list of numbers.');
  const widths = [...new Set(value)];
  if (widths.length > limit) throw new Error(`At most ${limit} widths at a time.`);
  for (const width of widths) {
    if (typeof width !== "number" || !Number.isInteger(width) || width < 200 || width > 3000) {
      throw new Error("Each width must be a whole number from 200 to 3000 (pixels).");
    }
  }
  return widths as number[];
}
