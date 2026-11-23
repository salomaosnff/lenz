import type { EditorSession } from "html-visual-editor/api";

/** Gradient text is not one property: a gradient background, clipped to the letters. */
export const TEXT_GRADIENT = "text-gradient";
const CLIP = ["background-clip", "-webkit-background-clip"];

/**
 * A shorthand such as `background: #fff` makes the browser report `initial` for every longhand it
 * did not mention. That is not something the user set, so it reads as empty; an `initial` that is
 * written out in the style attribute is kept.
 */
export function ownValue(
  style: Pick<CSSStyleDeclaration, "getPropertyValue" | "cssText">,
  prop: string,
) {
  const value = style.getPropertyValue(prop);
  if (value !== "initial") return value;
  const written = new RegExp(`(^|;)\\s*${prop.replace(/[-\\^$*+?.()|[\]{}]/g, "\\$&")}\\s*:`);
  return written.test(style.cssText) ? value : "";
}

/** The value a field shows: what the element's own `style` says (the stylesheet is not touched). */
export function readInline(el: HTMLElement, prop: string): string {
  if (prop !== TEXT_GRADIENT) return ownValue(el.style, prop);
  const clipped = CLIP.some((p) => el.style.getPropertyValue(p) === "text");
  const image = ownValue(el.style, "background-image");
  return clipped && image.includes("gradient") ? image : "";
}

/** Writes a field; an empty value removes it. */
export function writeInline(
  session: EditorSession | null | undefined,
  prop: string,
  value: string,
) {
  if (!session) return;
  if (prop !== TEXT_GRADIENT) return session.setStyle(prop, value);
  session.setStyle("background-image", value);
  for (const name of CLIP) session.setStyle(name, value ? "text" : "");
  session.setStyle("-webkit-text-fill-color", value ? "transparent" : "");
}

let scratch: CSSStyleDeclaration | undefined;

/**
 * How the browser stores a value for a property: what an element's `style` would hold after
 * `setProperty`. Two spellings of the same value come out identical. `''` when it is invalid.
 */
export function canonicalCss(prop: string, value: string): string {
  scratch ??= document.createElement("div").style;
  scratch.setProperty(prop, "");
  scratch.setProperty(prop, value);
  return scratch.getPropertyValue(prop);
}
