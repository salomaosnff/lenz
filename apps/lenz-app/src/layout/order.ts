/** What a panel gets when it does not say where it goes. */
export const DEFAULT_ORDER = 100;

/**
 * The panels in the order the activity bar shows them.
 *
 * By default that is by their `order` (lower first), keeping the order they were registered in when
 * the numbers are equal. Once the user has moved a panel, `saved` is what they chose: its ids come
 * first and in that order, and a panel that was not there when they chose (one installed since)
 * goes before the first panel that follows it by default, or at the end.
 */
export function orderContainers<T extends { id: string; order?: number }>(
  containers: readonly T[],
  saved: readonly string[],
): T[] {
  // The sort is stable: equal orders stay in the order they were registered.
  const byDefault = [...containers].sort(
    (a, b) => (a.order ?? DEFAULT_ORDER) - (b.order ?? DEFAULT_ORDER),
  );
  if (!saved.length) return byDefault;

  const byId = new Map(containers.map((c) => [c.id, c]));
  const result: T[] = [];
  for (const id of saved) {
    const container = byId.get(id);
    if (container && !result.includes(container)) result.push(container);
  }
  for (const container of byDefault) {
    if (result.includes(container)) continue;
    // Before the first panel that comes after it by default and is already there; at the end when
    // there is none. So a new panel stays near the ones it would be next to, not in the middle of
    // an order the user made.
    let at = result.length;
    for (let i = byDefault.indexOf(container) + 1; i < byDefault.length; i++) {
      const placed = result.indexOf(byDefault[i]!);
      if (placed !== -1) {
        at = placed;
        break;
      }
    }
    result.splice(at, 0, container);
  }
  return result;
}

/**
 * The saved order after the user moves some panels: `moved` is the new order of a few of them,
 * and each takes the place of one of them in the list, so the others stay where they are.
 */
export function withMoved(all: readonly string[], moved: readonly string[]): string[] {
  const set = new Set(moved);
  let next = 0;
  return all.map((id) => (set.has(id) ? moved[next++]! : id));
}
