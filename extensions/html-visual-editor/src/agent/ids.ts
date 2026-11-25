/**
 * Gives objects (the elements of the page) short ids that an agent can say back, and finds them
 * again. An id stays with its element for as long as the element lives; an element that is gone
 * (the page was reloaded, the element removed) has no way back.
 */
export function createIdRegistry<T extends object>(prefix = "e") {
  const ids = new WeakMap<T, string>();
  const found = new Map<string, WeakRef<T>>();
  let last = 0;

  return {
    /** The id of an object, giving it one the first time. */
    idOf(object: T): string {
      let id = ids.get(object);
      if (!id) {
        id = `${prefix}${++last}`;
        ids.set(object, id);
        found.set(id, new WeakRef(object));
      }
      return id;
    },
    /** The object with this id, if it is still around. */
    find(id: string): T | undefined {
      const object = found.get(id)?.deref();
      // Collected: forget the id, so the map does not fill up with dead ones.
      if (!object) found.delete(id);
      return object;
    },
    /** Whether a text looks like one of ours, whether or not the object is still there. */
    isId: (text: string) => new RegExp(`^${prefix}\\d+$`).test(text),
  };
}
