import { describe } from "../model";
import { session, type EditorSession } from "../session";
import { createIdRegistry } from "./ids";

/** The ids agents use for the elements of the page. */
export const elements = createIdRegistry<HTMLElement>("e");
export const idOf = (el: HTMLElement) => elements.idOf(el);

const NO_PAGE =
  'No page is open in the visual editor. Open an HTML file and show it in the "html-visual-editor.visual" editor (list_tabs, list_editors and set_tab_editor do that).';

/** The visual editor that is open, or why there is none. */
export function activeSession(): EditorSession & { root: { value: HTMLElement } } {
  const current = session.value;
  if (!current?.root.value) throw new Error(NO_PAGE);
  return current as never;
}

/**
 * The element an agent means: an id from `get_element_tree` (`e12`), or a CSS selector that matches
 * exactly one element. Left out, the selected element. The page itself is the `body`.
 */
export function resolveElement(page: EditorSession, target?: string): HTMLElement {
  const root = page.root.value!;
  if (target === undefined) {
    const selected = page.selected.value;
    if (!selected?.isConnected) {
      throw new Error(
        "Nothing is selected: pass a target (an id from get_element_tree, or a CSS selector).",
      );
    }
    return selected;
  }
  if (typeof target !== "string" || !target.trim()) {
    throw new Error('"target" must be an id from get_element_tree, or a CSS selector.');
  }
  if (elements.isId(target)) {
    const el = elements.find(target);
    if (!el || !root.contains(el)) {
      throw new Error(
        `The element ${target} is gone (removed, or the page was reloaded). Call get_element_tree again.`,
      );
    }
    return el;
  }
  const doc = root.ownerDocument;
  let found: HTMLElement[];
  try {
    found = [...doc.querySelectorAll<HTMLElement>(target)];
  } catch {
    throw new Error(`"${target}" is not a valid CSS selector.`);
  }
  // `html` stands for the page, as in the editor; what is outside the body is not part of it.
  found = [...new Set(found.map((el) => (el === doc.documentElement ? root : el)))].filter((el) =>
    root.contains(el),
  );
  if (!found.length) throw new Error(`Nothing in the page matches "${target}".`);
  if (found.length > 1) {
    const some = found
      .slice(0, 5)
      .map((el) => `${idOf(el)} ${describe(el)}`)
      .join(", ");
    throw new Error(
      `"${target}" matches ${found.length} elements (${some}${found.length > 5 ? ", ..." : ""}): use one of the ids, or a more specific selector.`,
    );
  }
  return found[0]!;
}

/** `tag#id.class`, with the id an agent uses for it. */
export const label = (el: HTMLElement) => `${idOf(el)} ${describe(el)}`;
