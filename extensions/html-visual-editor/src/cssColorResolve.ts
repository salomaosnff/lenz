import { parseColor, type Color } from "./colorModel";

/** An element whose computed style gives meaning to var(), currentcolor, light-dark()... */
export type ColorContext = Element | null | undefined;

/** Resolves a CSS color text to an actual color. `null` when the text is not a valid color. */
export type ColorResolver = (value: string) => string | null;

const SENTINELS = ["rgb(1, 2, 3)", "rgb(3, 2, 1)"];

/**
 * Asks the browser what `value` computes to, as if it were the `color` of an element inside
 * `context` (so `var(--x)` sees the variables of that element). Handles everything CSS can write:
 * var(), color-mix(), relative colors, light-dark(), system colors, currentcolor, calc()...
 *
 * Returns the computed color (`rgb(...)`, `color(...)`, `oklch(...)`...) or `null` if invalid.
 */
export function resolveCssColor(value: string, context?: ColorContext): string | null {
  const text = value.trim();
  if (!text) return null;
  const host = context ?? document.documentElement;
  const doc = host.ownerDocument;
  const win = doc.defaultView;
  if (!win) return null;

  // `var(--missing)` makes the declaration invalid at computed-value time: the color is then
  // inherited. A wrapper with a known color tells that case apart from a real result.
  const wrapper = doc.createElement("span");
  const probe = doc.createElement("span");
  wrapper.style.display = probe.style.display = "none";
  wrapper.append(probe);
  try {
    probe.style.color = text;
    if (!probe.style.color && !/\bvar\(/i.test(text)) return null; // rejected by the CSS parser
    host.append(wrapper);

    const results = SENTINELS.map((sentinel) => {
      wrapper.style.color = sentinel;
      return win.getComputedStyle(probe).color;
    });
    const [first, second] = results as [string, string];
    if (first === second) return first;
    // The result follows the inherited color: either the value is invalid (a missing variable)
    // or it really depends on it (currentcolor). Only the second case is a color.
    if (!/currentcolor/i.test(text)) return null;
    wrapper.style.color = "";
    return win.getComputedStyle(probe).color;
  } finally {
    wrapper.remove();
  }
}

/** A `ColorResolver` bound to an element. */
export const resolverFor =
  (context: ColorContext): ColorResolver =>
  (value) =>
    resolveCssColor(value, context);

/** Parses any CSS color: static syntaxes directly, the rest through the browser. */
export function resolveColor(value: string, resolver?: ColorResolver): Color | null {
  const direct = parseColor(value);
  if (direct) return direct;
  const computed = (resolver ?? resolverFor(null))(value);
  return computed ? parseColor(computed) : null;
}

export interface CssVariable {
  /** With the dashes: `--brand`. */
  name: string;
  /** Computed value for the context element, e.g. `#3a7bd5`. */
  value: string;
}

/** Custom properties declared in the document's style sheets and in the inline styles up the tree. */
export function collectCssVariables(context: Element): CssVariable[] {
  const doc = context.ownerDocument;
  const win = doc.defaultView;
  if (!win) return [];
  const names = new Set<string>();

  const readStyle = (style: CSSStyleDeclaration) => {
    for (let i = 0; i < style.length; i++) {
      const name = style.item(i);
      if (name.startsWith("--")) names.add(name);
    }
  };
  const readRules = (rules: CSSRuleList) => {
    for (const rule of Array.from(rules)) {
      if ("style" in rule) readStyle((rule as CSSStyleRule).style);
      // @media, @supports, @layer...: rules nested inside
      if ("cssRules" in rule && rule.cssRules) readRules(rule.cssRules as CSSRuleList);
    }
  };
  for (const sheet of Array.from(doc.styleSheets)) {
    try {
      readRules(sheet.cssRules);
    } catch {
      // Cross-origin style sheet: its rules are not readable.
    }
  }
  for (let el: Element | null = context; el; el = el.parentElement) {
    const style = (el as HTMLElement).style;
    if (style) readStyle(style);
  }

  const computed = win.getComputedStyle(context);
  return [...names]
    .sort()
    .map((name) => ({ name, value: computed.getPropertyValue(name).trim() }))
    .filter((variable) => variable.value !== "");
}
