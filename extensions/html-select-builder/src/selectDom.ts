import { STYLE_PROPS, selectStyle, type SelectOptions } from "./select";

/**
 * Editing a select that is already on the page. Each change touches only what it is about: an option
 * is renamed in place, not rebuilt, so its other attributes (class, data-*) stay.
 */

/**
 * The select an element belongs to: the select itself, one of its options, or a group. Also the
 * wrapper the builder makes when there is a label: a `div` that holds just the label and the select.
 */
export function closestSelect(el: Element | null | undefined): HTMLSelectElement | null {
  if (!el) return null;
  const inside = el.closest("select") as HTMLSelectElement | null;
  if (inside) return inside;
  const wrapped = el.querySelector(":scope > select") as HTMLSelectElement | null;
  return wrapped && el.children.length <= 2 ? wrapped : null;
}

type Part = HTMLOptionElement | HTMLOptGroupElement;

export interface DomItem {
  kind: "option" | "group";
  label: string;
  value: string;
  selected: boolean;
  disabled: boolean;
  /** The element itself: the changes below take it, so nothing depends on a position. */
  el: Part;
  /** Whether it can move up or down among its neighbors. */
  canUp: boolean;
  canDown: boolean;
}

/** Options and groups in the order of the page, a group followed by its options. */
export function readItems(select: HTMLSelectElement): DomItem[] {
  const items: DomItem[] = [];
  const add = (el: Part, siblings: Element[]) => {
    const index = siblings.indexOf(el);
    const isOption = el.tagName === "OPTION";
    items.push({
      kind: isOption ? "option" : "group",
      label: isOption ? (el as HTMLOptionElement).text : (el as HTMLOptGroupElement).label,
      value: isOption ? ((el as HTMLOptionElement).getAttribute("value") ?? "") : "",
      // The attribute, not the state: it is what ends up in the file.
      selected: isOption && el.hasAttribute("selected"),
      disabled: el.hasAttribute("disabled"),
      el,
      canUp: index > 0,
      canDown: index < siblings.length - 1,
    });
  };
  for (const child of [...select.children] as Part[]) {
    add(child, [...select.children]);
    if (child.tagName === "OPTGROUP") {
      for (const inner of [...child.children] as Part[]) add(inner, [...child.children]);
    }
  }
  return items;
}

export interface SelectInfo {
  name: string;
  id: string;
  multiple: boolean;
  required: boolean;
  disabled: boolean;
  size: number;
  options: number;
}

export const describeSelect = (select: HTMLSelectElement): SelectInfo => ({
  name: select.getAttribute("name") ?? "",
  id: select.id,
  multiple: select.hasAttribute("multiple"),
  required: select.hasAttribute("required"),
  disabled: select.hasAttribute("disabled"),
  size: Number(select.getAttribute("size")) || 0,
  options: select.options.length,
});

/** Sets an attribute of the select; an empty value takes it off. */
export function setAttr(select: HTMLSelectElement, name: "name" | "id" | "size", value: string) {
  if (value.trim()) select.setAttribute(name, value.trim());
  else select.removeAttribute(name);
}

export function setFlag(
  select: HTMLSelectElement,
  flag: "multiple" | "required" | "disabled",
  on: boolean,
) {
  if (on) select.setAttribute(flag, "");
  else select.removeAttribute(flag);
  if (flag === "multiple" && !on) {
    // A single choice has one selected option: the first one stays.
    const chosen = [...select.options].filter((o) => o.hasAttribute("selected"));
    chosen.slice(1).forEach((o) => o.removeAttribute("selected"));
  }
}

export function setLabel(el: Part, text: string) {
  if (el.tagName === "OPTION") el.textContent = text;
  else el.setAttribute("label", text);
}

export function setValue(option: HTMLOptionElement, value: string) {
  option.setAttribute("value", value);
}

export function setDisabled(el: Part, on: boolean) {
  if (on) el.setAttribute("disabled", "");
  else el.removeAttribute("disabled");
}

/** Marks an option as chosen by default. In a single choice that takes the mark off the others. */
export function setSelected(select: HTMLSelectElement, option: HTMLOptionElement, on: boolean) {
  if (on && !select.multiple) {
    for (const other of select.options) {
      if (other !== option) {
        other.removeAttribute("selected");
        other.selected = false;
      }
    }
  }
  if (on) option.setAttribute("selected", "");
  else option.removeAttribute("selected");
  option.selected = on;
}

/** Adds an option after `after` (in its group, if it is in one), or at the end. */
export function addOption(
  select: HTMLSelectElement,
  after: Part | null,
  label = "Nova opção",
): HTMLOptionElement {
  const option = select.ownerDocument.createElement("option");
  option.textContent = label;
  if (after && after.tagName === "OPTION") after.after(option);
  // Right after a group's name, the option goes first inside it.
  else if (after && after.tagName === "OPTGROUP") after.prepend(option);
  else select.append(option);
  return option;
}

export function addGroup(select: HTMLSelectElement, label = "Novo grupo"): HTMLOptGroupElement {
  const groupEl = select.ownerDocument.createElement("optgroup");
  groupEl.setAttribute("label", label);
  select.append(groupEl);
  return groupEl;
}

/** Removes an option. Removing a group keeps its options: they take its place. */
export function removeItem(select: HTMLSelectElement, el: Part): boolean {
  if (el.tagName === "OPTGROUP") el.replaceWith(...el.children);
  else {
    if (select.options.length <= 1) return false; // a select with no option is not much of one
    el.remove();
  }
  return true;
}

/** Moves an item up or down among its neighbors, inside the group or the select it is in. */
export function moveItem(el: Part, direction: -1 | 1): boolean {
  const neighbor = direction < 0 ? el.previousElementSibling : el.nextElementSibling;
  if (!neighbor) return false;
  if (direction < 0) neighbor.before(el);
  else neighbor.after(el);
  return true;
}

const MANAGED = STYLE_PROPS;

/** Gives the select the look of the builder. What else is in its style stays. */
export function applyStyle(
  select: HTMLSelectElement,
  options: Pick<SelectOptions, "styled" | "fullWidth">,
) {
  for (const prop of MANAGED) select.style.removeProperty(prop);
  for (const [prop, value] of Object.entries(selectStyle(options)))
    select.style.setProperty(prop, value);
  if (!select.getAttribute("style")) select.removeAttribute("style");
}
