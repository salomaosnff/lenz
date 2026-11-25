/** Splits a text at its `code` spans, so the template can wrap them in <code>. */
export function splitCode(text: string): { text: string; code: boolean }[] {
  return text.split(/`([^`]+)`/).map((part, i) => ({ text: part, code: i % 2 === 1 }));
}
