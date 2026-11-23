/** How many segments the breadcrumb shows before it folds the middle ones into a menu. */
export const MAX_SEGMENTS = 5;

export interface Folded<T> {
  /** The first segments, always visible. */
  head: T[];
  /** The ones folded into the "…" menu, outermost first. */
  hidden: T[];
  /** The last segments, always visible: the selected element is the last. */
  tail: T[];
}

/**
 * Shortens a long path the way the breadcrumb of VS Code does: the start and, above all, the end
 * stay (that is where the selected element is), and the middle goes into a menu.
 */
export function fold<T>(path: readonly T[], max = MAX_SEGMENTS): Folded<T> {
  if (path.length <= max) return { head: [...path], hidden: [], tail: [] };
  const head = path.slice(0, 1);
  const tail = path.slice(path.length - (max - 2));
  return { head, hidden: path.slice(head.length, path.length - tail.length), tail };
}
