import type { EditorSession } from "../session";
import {
  VOID_TAGS,
  checkAttribute,
  checkAttributeName,
  checkElement,
  checkProperty,
  checkTag,
  checkValue,
  splitImportant,
} from "./safety";
import { splitDeclarations } from "./declarations";
import { label, idOf } from "./target";

export type Position = "append" | "prepend" | "before" | "after";
export const POSITIONS: readonly Position[] = ["append", "prepend", "before", "after"];

const tagOf = (el: Element) => el.tagName.toLowerCase();

/** Whether the page has a place for something at `position` of `ref`, or why not. */
export function checkPlace(page: EditorSession, ref: HTMLElement, position: Position) {
  if ((position === "before" || position === "after") && ref === page.root.value) {
    throw new Error("The page has nothing beside it: use position append or prepend.");
  }
  if ((position === "append" || position === "prepend") && VOID_TAGS.has(tagOf(ref))) {
    throw new Error(`<${tagOf(ref)}> cannot hold anything: use position before or after.`);
  }
}

function place(ref: HTMLElement, position: Position, nodes: Node[]) {
  if (position === "before") ref.before(...nodes);
  else if (position === "after") ref.after(...nodes);
  else if (position === "prepend") ref.prepend(...nodes);
  else ref.append(...nodes);
}

// ---- Styles -----------------------------------------------------------------------------------

export interface Declaration {
  property: string;
  /** Empty: take the property away. */
  value: string;
  priority: "important" | "";
}

/**
 * Reads `{ "background-color": "red", "margin": null }` into declarations, and refuses the ones
 * the browser would silently ignore (a typo in a value) before anything is written.
 */
export function parseDeclarations(doc: Document, styles: Record<string, unknown>): Declaration[] {
  const scratch = doc.createElement("div").style;
  return Object.entries(styles).map(([name, raw]) => {
    const property = checkProperty(name);
    if (raw === null || raw === "") return { property, value: "", priority: "" };
    if (typeof raw !== "string" && typeof raw !== "number") {
      throw new Error(`The value of "${name}" must be a string, or null to remove it.`);
    }
    const { value, priority } = splitImportant(String(raw));
    checkValue(name, value);
    scratch.setProperty(property, value, priority);
    if (!scratch.getPropertyValue(property)) {
      throw new Error(`"${value}" is not a valid value for "${property}".`);
    }
    scratch.removeProperty(property);
    return { property, value, priority };
  });
}

/** The inline style of an element, as it is written. */
export const inlineStyle = (el: HTMLElement) => splitDeclarations(el.style.cssText);

// ---- Editing ----------------------------------------------------------------------------------

export function selectElement(page: EditorSession, el: HTMLElement, additive: boolean) {
  page.select(el, additive);
  return { selected: page.selection.value.map(label) };
}

export interface InsertOptions {
  tag?: string;
  html?: string;
  text?: string;
  attributes?: Record<string, unknown>;
  styles?: Record<string, unknown>;
  select: boolean;
}

/** A fragment of HTML as a document fragment, with every element and attribute in it checked. */
function parseFragment(doc: Document, html: string): DocumentFragment {
  const template = doc.createElement("template");
  template.innerHTML = html;
  for (const el of template.content.querySelectorAll("*")) {
    checkElement(
      tagOf(el),
      [...el.attributes].map(({ name, value }) => ({ name, value })),
    );
  }
  return template.content;
}

/** Builds what is to be inserted, checked: one element from a tag, or the elements of a fragment. */
function build(doc: Document, options: InsertOptions): HTMLElement[] {
  if ((options.tag === undefined) === (options.html === undefined)) {
    throw new Error('Pass either "tag" (one element) or "html" (a fragment), and not both.');
  }
  if (options.html !== undefined) {
    const nodes = [...parseFragment(doc, options.html).children] as HTMLElement[];
    if (!nodes.length) throw new Error('"html" has no element in it.');
    return nodes;
  }
  const el = doc.createElement(checkTag(options.tag!));
  for (const [name, value] of Object.entries(options.attributes ?? {}))
    writeAttribute(el, name, value);
  if (options.text !== undefined) {
    if (VOID_TAGS.has(tagOf(el))) throw new Error(`<${tagOf(el)}> cannot hold text.`);
    el.textContent = options.text;
  }
  const declarations = parseDeclarations(doc, options.styles ?? {});
  for (const { property, value, priority } of declarations) {
    if (value) el.style.setProperty(property, value, priority);
  }
  return [el];
}

export function insertElement(
  page: EditorSession,
  ref: HTMLElement,
  position: Position,
  options: InsertOptions,
) {
  checkPlace(page, ref, position);
  const created = build(ref.ownerDocument, options);
  place(ref, position, created);
  if (options.select) page.select(created[0]!);
  const ids = created.map(idOf);
  page.commit(`Agente: inserir ${ids.join(", ")}`);
  return {
    inserted: created.map((el) => ({ id: idOf(el), tag: tagOf(el) })),
    parent: label(created[0]!.parentElement!),
  };
}

export function setText(
  page: EditorSession,
  el: HTMLElement,
  text: string,
  replaceChildren: boolean,
) {
  if (VOID_TAGS.has(tagOf(el))) throw new Error(`<${tagOf(el)}> cannot hold text.`);
  if (el.children.length && !replaceChildren) {
    throw new Error(
      `${label(el)} has ${el.children.length} element(s) inside it, which setting the text would remove. Set the text of one of them, or pass replaceChildren.`,
    );
  }
  el.textContent = text;
  page.commit(`Agente: texto de ${idOf(el)}`);
  return { id: idOf(el), text };
}

function writeAttribute(el: HTMLElement, name: string, raw: unknown) {
  if (raw === null || raw === false) {
    checkAttributeName(name);
    return el.removeAttribute(name);
  }
  const value =
    raw === true
      ? ""
      : typeof raw === "string" || typeof raw === "number"
        ? String(raw)
        : undefined;
  if (value === undefined) {
    throw new Error(
      `The value of "${name}" must be a string, a number, true or false, or null to remove it.`,
    );
  }
  checkAttribute(name, value);
  el.setAttribute(name, value);
}

export function attributesOf(el: HTMLElement): Record<string, string> {
  return Object.fromEntries([...el.attributes].map(({ name, value }) => [name, value]));
}

export function setAttributes(
  page: EditorSession,
  el: HTMLElement,
  attributes: Record<string, unknown>,
) {
  // Checked as a whole first: an agent that gets an error finds the element as it was.
  for (const [name, raw] of Object.entries(attributes)) {
    if (raw === null || raw === false) checkAttributeName(name);
    else checkAttribute(name, typeof raw === "string" ? raw : "");
  }
  for (const [name, raw] of Object.entries(attributes)) writeAttribute(el, name, raw);
  page.commit(`Agente: atributos de ${idOf(el)}`);
  return { id: idOf(el), attributes: attributesOf(el) };
}

export function setStyles(page: EditorSession, el: HTMLElement, styles: Record<string, unknown>) {
  const declarations = parseDeclarations(el.ownerDocument, styles);
  for (const { property, value, priority } of declarations) {
    if (value) el.style.setProperty(property, value, priority);
    else el.style.removeProperty(property);
  }
  if (!el.getAttribute("style")) el.removeAttribute("style");
  page.commit(`Agente: estilo de ${idOf(el)}`);
  return { id: idOf(el), style: inlineStyle(el) };
}

export function moveElement(
  page: EditorSession,
  el: HTMLElement,
  to: HTMLElement,
  position: Position,
) {
  if (el === page.root.value) throw new Error("The page itself cannot be moved.");
  if (el === to || el.contains(to))
    throw new Error("An element cannot go into itself, or into what it holds.");
  checkPlace(page, to, position);
  place(to, position, [el]);
  page.commit(`Agente: mover ${idOf(el)}`);
  return { id: idOf(el), parent: el.parentElement ? label(el.parentElement) : null };
}

export function removeElement(page: EditorSession, el: HTMLElement) {
  if (el === page.root.value) throw new Error("The page itself cannot be removed.");
  const parent = el.parentElement!;
  const removed = label(el);
  el.remove();
  page.select(parent);
  page.commit(`Agente: excluir ${removed.split(" ")[0]}`);
  return { removed, selected: label(parent) };
}

export function duplicateElement(page: EditorSession, el: HTMLElement) {
  if (el === page.root.value) throw new Error("The page itself cannot be duplicated.");
  const copy = el.cloneNode(true) as HTMLElement;
  el.after(copy);
  page.select(copy);
  page.commit(`Agente: duplicar ${idOf(el)}`);
  return { id: idOf(copy), tag: tagOf(copy) };
}

const LAYOUT_PROPERTIES = [
  "display",
  "position",
  "width",
  "height",
  "margin",
  "padding",
  "color",
  "background-color",
  "font-family",
  "font-size",
  "font-weight",
];

/** Everything known about one element: what it is, where it is, and how it looks now. */
export function describeElement(el: HTMLElement) {
  const computed = el.ownerDocument.defaultView!.getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  const text = (el.textContent ?? "").replace(/\s+/g, " ").trim();
  const html = el.outerHTML;
  return {
    id: idOf(el),
    tag: tagOf(el),
    parent: el.parentElement ? label(el.parentElement) : null,
    children: [...el.children].map((child) => label(child as HTMLElement)),
    attributes: Object.fromEntries(
      Object.entries(attributesOf(el)).map(([name, value]) => [
        name,
        /^data:/i.test(value) ? `${value.slice(0, 40)}… (${value.length} characters)` : value,
      ]),
    ),
    inlineStyle: inlineStyle(el),
    computedStyle: Object.fromEntries(
      LAYOUT_PROPERTIES.map((p) => [p, computed.getPropertyValue(p)]),
    ),
    box: {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    },
    text: text.length > 500 ? `${text.slice(0, 500)}…` : text,
    html: html.length > 1500 ? `${html.slice(0, 1500)}…` : html,
  };
}

/** Replaces what is inside an element with a fragment of HTML: formatted text, a small structure. */
export function setHtml(page: EditorSession, el: HTMLElement, html: string) {
  if (VOID_TAGS.has(tagOf(el))) throw new Error(`<${tagOf(el)}> cannot hold anything.`);
  const content = parseFragment(el.ownerDocument, html);
  el.replaceChildren(content);
  page.commit(`Agente: html de ${idOf(el)}`);
  return { id: idOf(el), children: [...el.children].map((child) => label(child as HTMLElement)) };
}

/** Selects the parent, as the editor's command does, but of any element. */
export function selectParent(page: EditorSession, el: HTMLElement) {
  const parent = el.parentElement;
  if (!parent || el === page.root.value) throw new Error("The page has no parent.");
  page.select(parent);
  return { selected: [label(parent)] };
}

/** Selects what is directly inside an element, skipping the plumbing (`script`, `style`...). */
export function selectChildren(page: EditorSession, el: HTMLElement, children: HTMLElement[]) {
  if (!children.length) throw new Error(`${label(el)} has nothing inside it.`);
  children.forEach((child, index) => page.select(child, index > 0));
  return { selected: page.selection.value.slice(0, 100).map(label) };
}

/** Steps an element over its neighbor, as Alt+Up and Alt+Down do. */
export function reorderElement(page: EditorSession, el: HTMLElement, direction: "up" | "down") {
  if (el === page.root.value) throw new Error("The page itself cannot be moved.");
  const neighbor = direction === "up" ? el.previousElementSibling : el.nextElementSibling;
  if (!neighbor)
    throw new Error(
      `${label(el)} is already the ${direction === "up" ? "first" : "last"} in its parent.`,
    );
  // The editor's own move: it records the entry in the history and keeps the selection.
  page.select(el);
  page.move(direction === "up" ? -1 : 1);
  return {
    id: idOf(el),
    parent: label(el.parentElement!),
    before: neighbor.nextElementSibling === el ? label(neighbor as HTMLElement) : undefined,
  };
}
