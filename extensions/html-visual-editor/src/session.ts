import { shallowRef, type ComputedRef, type Ref, type ShallowRef } from "vue";
import type { ColorResolver, CssVariable } from "./cssColorResolve";

/** What other extensions can read and change about the visual editor that is open. */
export interface EditorSession {
  /** The `body` of the canvas, or `null` while it loads. */
  readonly root: Readonly<ShallowRef<HTMLElement | null>>;
  /**
   * The main selected element of the canvas (the first of `selection`); the panels read their
   * values from it. The DOM is not reactive, so also watch `version`.
   */
  readonly selected: Readonly<Ref<HTMLElement | null>>;
  /** Every selected element. */
  readonly selection: Readonly<ShallowRef<HTMLElement[]>>;
  /** Bumps after each edit, so panels re-read the selected element. */
  readonly version: Readonly<Ref<number>>;
  /**
   * Writes the canvas back to the file; call it after changing the selected element. `label` names
   * the entry in the file's history; quick edits with the same label join one entry.
   */
  commit(label?: string): void;
  /** Selects the children of the selected element (the ones next to it, if it has none). */
  selectAll(): void;
  /** Selects the parent of the selected element. */
  selectParent(): void;
  /** Duplicates the selected elements, and selects the copies. */
  duplicate(): void;
  /** Removes the selected elements, and selects the parent of the first. */
  remove(): void;
  /** Moves the selected elements among their siblings. */
  move(direction: -1 | 1): void;
  /** Inserts HTML after the selected element (inside it, if it is a container). */
  insert(html: string): void;
  /** Selects an element of the canvas; `additive` adds it to the selection (or takes it out). */
  select(el: HTMLElement | null, additive?: boolean): void;
  /** Sets (or, when empty, removes) an inline style of every selected element. */
  setStyle(prop: string, value: string): void;
  /** Resolves `var()` and friends against the selected element. */
  readonly colorResolver: ComputedRef<ColorResolver>;
  /** Custom properties the selected element can see. */
  readonly cssVariables: ComputedRef<CssVariable[]>;
}

/** The visual editor shown right now, or `null`. */
export const session = shallowRef<EditorSession | null>(null);
