import { shallowReactive } from "vue";
import type { Disposable } from "lenz-sdk";
import type { ElementBuilder } from "./api";

/**
 * The element builders that extensions have added, in the order they were added. The view
 * "Construtores de elementos" lists them. Reactive: the view follows builders coming and going.
 */
export const builders = shallowReactive<ElementBuilder[]>([]);

/** Adds a builder to the list. Dispose to take it out. Throws when its id is already there. */
export function registerBuilder(builder: ElementBuilder): Disposable {
  if (builders.some((b) => b.id === builder.id)) {
    throw new Error(`There is already a builder "${builder.id}".`);
  }
  if (!builder.title.trim()) throw new Error(`The builder "${builder.id}" needs a title.`);
  builders.push(builder);
  return {
    dispose() {
      const index = builders.indexOf(builder);
      if (index !== -1) builders.splice(index, 1);
    },
  };
}
