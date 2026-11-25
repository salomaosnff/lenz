/** The weight of a selector: ids, then classes (attributes, pseudo-classes), then tags (pseudo-elements). */
export type Specificity = [ids: number, classes: number, tags: number];

/**
 * Counts what a selector weighs. It reads the selectors the game uses (tags, `.class`, `#id`,
 * `[attr]`, `:pseudo-class`, `::pseudo-element`, `:not()`), not the whole of CSS.
 */
export function specificity(selector: string): Specificity {
  let a = 0;
  let b = 0;
  let c = 0;
  const take = (pattern: RegExp, add: () => void, text: string) =>
    text.replace(pattern, () => {
      add();
      return " ";
    });
  let s = selector;
  s = take(/\[[^\]]*\]/g, () => b++, s);
  s = take(/::[\w-]+/g, () => c++, s);
  // The selector inside `:not()` is what counts, not the `:not` itself.
  s = s.replace(/:not\(/g, " (");
  s = take(/:[\w-]+(\([^)]*\))?/g, () => b++, s);
  s = take(/#[\w-]+/g, () => a++, s);
  s = take(/\.[\w-]+/g, () => b++, s);
  s = take(/[\w-]+/g, () => c++, s);
  return [a, b, c];
}

/** Negative if `x` weighs less than `y`, positive if more, 0 on a tie. */
export function compareSpecificity(x: Specificity, y: Specificity): number {
  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
}

/**
 * The positions of `selectors` from the weakest to the strongest. On a tie the one written later
 * is the stronger, as in the cascade.
 */
export function weakestFirst(selectors: readonly string[]): number[] {
  return selectors
    .map((selector, index) => ({ index, weight: specificity(selector) }))
    .sort((p, q) => compareSpecificity(p.weight, q.weight) || p.index - q.index)
    .map((p) => p.index);
}
