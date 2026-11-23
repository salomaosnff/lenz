const escapeIdent = (text: string) =>
  typeof CSS !== "undefined" && CSS.escape ? CSS.escape(text) : text.replace(/[^\w-]/g, "\\$&");

/** `tag#id.class.other`, enough to point at the element in a stylesheet. */
export function selectorOf(el: { tagName: string; id: string; classList: Iterable<string> }) {
  const id = el.id ? `#${escapeIdent(el.id)}` : "";
  const classes = [...el.classList].map((name) => `.${escapeIdent(name)}`).join("");
  return `${el.tagName.toLowerCase()}${id}${classes}`;
}

export type Declaration = [prop: string, value: string];

/** The CSS rule for an element, ready to paste into a stylesheet. */
export function cssRule(selector: string, declarations: Declaration[]): string {
  const body = declarations
    .filter(([, value]) => value)
    .map(([prop, value]) => `  ${prop}: ${value};`);
  return body.length
    ? `${selector} {\n${body.join("\n")}\n}`
    : `${selector} {\n  /* sem valor */\n}`;
}

/** What a field writes. Gradient text is a gradient background clipped to the letters. */
export function declarationsOf(prop: string, value: string): Declaration[] {
  if (prop !== "text-gradient") return [[prop, value]];
  return [
    ["background-image", value],
    ["background-clip", value && "text"],
    ["-webkit-background-clip", value && "text"],
    ["-webkit-text-fill-color", value && "transparent"],
  ];
}
