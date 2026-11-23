/** MDN reference page of a CSS property; MDN redirects to the reader's language. */
/** Fields that write several properties have no page of their own. */
const documented: Record<string, string> = { "text-gradient": "background-clip" };

export const mdnUrl = (prop: string) =>
  `https://developer.mozilla.org/docs/Web/CSS/${encodeURIComponent(documented[prop] ?? prop)}`;
