/**
 * The declarations of a block of CSS (`color: red; padding: 0 !important`), in order. Read from
 * the text the browser gives (`style.cssText`) and not from the style object, which lists every
 * longhand a shorthand sets (`padding-top`...), with `initial` for the ones it did not say.
 */
export function splitDeclarations(cssText: string): Record<string, string> {
  const result: Record<string, string> = {};
  let start = 0;
  let depth = 0;
  let quote = "";

  const take = (end: number) => {
    const part = cssText.slice(start, end);
    const colon = part.indexOf(":");
    const name = part.slice(0, colon).trim();
    const value = part.slice(colon + 1).trim();
    if (colon > 0 && name && value) result[name] = value;
    start = end + 1;
  };

  for (let i = 0; i < cssText.length; i++) {
    const char = cssText[i]!;
    if (quote) {
      if (char === "\\") i++;
      else if (char === quote) quote = "";
    } else if (char === '"' || char === "'") quote = char;
    else if (char === "(") depth++;
    else if (char === ")") depth = Math.max(0, depth - 1);
    // A `;` inside `url(data:image/png;base64,...)` or a string does not end the declaration.
    else if (char === ";" && depth === 0) take(i);
  }
  take(cssText.length);
  return result;
}
