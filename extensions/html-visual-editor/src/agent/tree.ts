import { idOf } from "./target";

/** Elements that are the plumbing of the page, not its content. */
const SKIPPED = new Set(["SCRIPT", "STYLE", "TEMPLATE", "LINK", "META", "NOSCRIPT"]);

/** The attributes that say what an element is for; the rest is in `get_element`. */
const SHOWN = [
  "href",
  "src",
  "alt",
  "type",
  "name",
  "value",
  "placeholder",
  "for",
  "role",
  "aria-label",
  "title",
  "target",
  "rel",
];

export interface TreeNode {
  id: string;
  tag: string;
  /** The `id` attribute. */
  htmlId?: string;
  classes?: string[];
  /** What is written directly in it, shortened. */
  text?: string;
  attributes?: Record<string, string>;
  selected?: true;
  children?: TreeNode[];
  /** How many children are not listed, for the tree is cut here. */
  hiddenChildren?: number;
}

const shorten = (value: string, max: number) =>
  value.length > max ? `${value.slice(0, max)}…` : value;

/** An attribute value for an agent to read: an inlined file would be thousands of useless characters. */
export function readable(value: string, max = 120): string {
  const data = /^data:([^;,]*)/i.exec(value);
  return data ? `data:${data[1]}… (${value.length} characters)` : shorten(value, max);
}

/** What is written directly in an element, in one line. */
export function ownText(el: HTMLElement, max = 80): string {
  const text = [...el.childNodes]
    .filter((node) => node.nodeType === 3)
    .map((node) => node.textContent ?? "")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  return shorten(text, max);
}

export const contentChildren = (el: HTMLElement) =>
  [...el.children].filter((child) => !SKIPPED.has(child.tagName)) as HTMLElement[];

export interface Budget {
  /** Nodes that can still be listed. */
  left: number;
  truncated: boolean;
}

/** The element and what is inside it, `depth` levels down, as far as the budget goes. */
export function describeTree(
  el: HTMLElement,
  selection: ReadonlySet<Element>,
  depth: number,
  budget: Budget,
): TreeNode {
  budget.left--;
  const node: TreeNode = { id: idOf(el), tag: el.tagName.toLowerCase() };
  if (el.id) node.htmlId = el.id;
  if (el.classList.length) node.classes = [...el.classList];
  const text = ownText(el);
  if (text) node.text = text;
  const attributes = Object.fromEntries(
    SHOWN.flatMap((name) => {
      const value = el.getAttribute(name);
      return value === null ? [] : [[name, readable(value)]];
    }),
  );
  if (Object.keys(attributes).length) node.attributes = attributes;
  if (selection.has(el)) node.selected = true;

  const children = contentChildren(el);
  if (!children.length) return node;
  if (depth <= 0) {
    budget.truncated = true;
    node.hiddenChildren = children.length;
    return node;
  }
  node.children = [];
  for (const [index, child] of children.entries()) {
    if (budget.left <= 0) {
      budget.truncated = true;
      node.hiddenChildren = children.length - index;
      break;
    }
    node.children.push(describeTree(child, selection, depth - 1, budget));
  }
  return node;
}
