/** The value after `current` in `values`, and `''` (no value, back to the default) after the last. */
export function nextInCycle(values: readonly string[], current: string): string {
  const index = values.indexOf(current);
  return values[index + 1] ?? (index === -1 ? values[0]! : "");
}

/**
 * The inline `display` that toggles flex. Returns `''` to drop the inline value.
 * Flex on (inline or from a stylesheet) goes off; otherwise it goes on.
 */
export function toggleFlex(inline: string, computed: string): string {
  if (!computed.includes("flex")) return "flex";
  // Written on the element itself: dropping it is enough. From a stylesheet: override it.
  return inline.includes("flex") ? "" : "block";
}

/** Values the justification shortcut goes through (`justify-content`). */
export const JUSTIFY = [
  "flex-start",
  "center",
  "flex-end",
  "space-between",
  "space-around",
  "space-evenly",
];

/** Values the text alignment shortcut goes through (`text-align`). */
export const TEXT_ALIGN = ["left", "center", "right", "justify"];

/** HTML of the `d` shortcut: a box that can be seen and selected while it is empty. */
export const NEW_DIV = '<div style="min-height:48px;padding:16px;border:1px dashed #a1a1aa"></div>';
