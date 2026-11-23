export type SelectItem =
  | { kind: "option"; label: string; value: string; selected: boolean; disabled: boolean }
  | { kind: "group"; label: string; disabled: boolean };

/** What the builder offers; it shapes a new select. */
export interface SelectOptions {
  /** Options and groups, in order: a group holds the options that follow it, up to the next group. */
  items: SelectItem[];
  name: string;
  id: string;
  /** The text of a `label` put before the select; empty for none. */
  label: string;
  /** A first option that cannot be chosen, shown while nothing is chosen. Not used when `multiple`. */
  placeholder: string;
  multiple: boolean;
  /** Rows shown at once; 0 for the browser's default. */
  size: number;
  required: boolean;
  disabled: boolean;
  /** A basic look: padding, border, rounded corners. */
  styled: boolean;
  fullWidth: boolean;
}

export const option = (
  label: string,
  value = "",
  over: Partial<Extract<SelectItem, { kind: "option" }>> = {},
): SelectItem => ({
  kind: "option",
  label,
  value,
  selected: false,
  disabled: false,
  ...over,
});

export const group = (label: string): SelectItem => ({ kind: "group", label, disabled: false });

export const defaultOptions = (): SelectOptions => ({
  items: [option("Opção 1", "opcao-1"), option("Opção 2", "opcao-2"), option("Opção 3", "opcao-3")],
  name: "opcao",
  // Empty: the id follows the name, as the field says.
  id: "",
  label: "Escolha uma opção",
  placeholder: "Selecione…",
  multiple: false,
  size: 0,
  required: false,
  disabled: false,
  styled: true,
  fullWidth: false,
});

export const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** `São Paulo` -> `sao-paulo`: a value made from a label. */
export function slug(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Gives a value to the options that have none, made from their label. */
export const withValues = (items: SelectItem[]): SelectItem[] =>
  items.map((item) =>
    item.kind === "option" && !item.value.trim() ? { ...item, value: slug(item.label) } : item,
  );

/** The options kept to what a select can be: one selected when it is a single choice, and so on. */
export function normalize(input: SelectOptions): SelectOptions {
  const multiple = input.multiple;
  let seen = false;
  const items = input.items.map((item): SelectItem => {
    if (item.kind === "group") return { ...item, label: item.label.trim() };
    const selected = item.selected && (multiple || !seen);
    if (selected) seen = true;
    return { ...item, selected };
  });
  const name = input.name.trim();
  const label = input.label.trim();
  const size = Math.max(0, Math.round(Number.isFinite(input.size) ? input.size : 0));
  return {
    ...input,
    items,
    name,
    label,
    // A label needs an id to point at: made from the name when it was left empty.
    id: input.id.trim() || (label ? slug(name) || "campo" : ""),
    placeholder: multiple ? "" : input.placeholder.trim(),
    // A size of one is the same as none for a single choice.
    size: multiple ? size : size >= 2 ? size : 0,
  };
}

const SELECT_STYLE =
  "padding:6px 8px;border:1px solid #d4d4d8;border-radius:6px;font:inherit;background:#fff;color:inherit";

/** The properties of `style` the builder manages on a select; the rest of its style is left alone. */
export const STYLE_PROPS = [
  "padding",
  "border",
  "border-radius",
  "font",
  "background",
  "color",
  "width",
  "box-sizing",
] as const;

export function selectStyle(
  o: Pick<SelectOptions, "styled" | "fullWidth">,
): Record<string, string> {
  const style: Record<string, string> = {};
  if (o.styled) {
    style.padding = "6px 8px";
    style.border = "1px solid #d4d4d8";
    style["border-radius"] = "6px";
    style.font = "inherit";
    style.background = "#fff";
    style.color = "inherit";
  }
  if (o.fullWidth) {
    style.width = "100%";
    style["box-sizing"] = "border-box";
  }
  return style;
}

const styleText = (style: Record<string, string>) =>
  Object.entries(style)
    .map(([prop, value]) => `${prop}:${value}`)
    .join(";");

/** The HTML of a new select. With a label it is a `div` holding both, so it is one element. */
export function renderSelect(input: SelectOptions): string {
  const o = normalize(input);
  const attrs: string[] = [];
  if (o.id) attrs.push(`id="${escapeHtml(o.id)}"`);
  if (o.name) attrs.push(`name="${escapeHtml(o.name)}"`);
  if (o.multiple) attrs.push("multiple");
  if (o.size) attrs.push(`size="${o.size}"`);
  if (o.required) attrs.push("required");
  if (o.disabled) attrs.push("disabled");
  const style = styleText(selectStyle(o));
  if (style) attrs.push(`style="${style}"`);

  const anySelected = o.items.some((i) => i.kind === "option" && i.selected);
  const out: string[] = [];
  if (o.placeholder) {
    out.push(
      `<option value="" disabled${anySelected ? "" : " selected"}>${escapeHtml(o.placeholder)}</option>`,
    );
  }
  let open = false;
  for (const item of o.items) {
    if (item.kind === "group") {
      if (open) out.push("</optgroup>");
      out.push(`<optgroup label="${escapeHtml(item.label)}"${item.disabled ? " disabled" : ""}>`);
      open = true;
    } else {
      const value = item.value ? ` value="${escapeHtml(item.value)}"` : "";
      out.push(
        `<option${value}${item.selected ? " selected" : ""}${item.disabled ? " disabled" : ""}>${escapeHtml(item.label)}</option>`,
      );
    }
  }
  if (open) out.push("</optgroup>");

  const select = `<select${attrs.length ? " " + attrs.join(" ") : ""}>${out.join("")}</select>`;
  if (!o.label) return select;
  return `<div><label for="${escapeHtml(o.id)}" style="display:block;margin-bottom:4px;font-weight:600">${escapeHtml(o.label)}</label>${select}</div>`;
}

/**
 * Reads a list written as text, one option per line:
 *   `Rótulo`, or `Rótulo | valor`; `*` at the start marks it selected and `!` disabled;
 *   `## Nome` starts a group.
 */
export function parseLines(text: string): SelectItem[] {
  const items: SelectItem[] = [];
  for (const raw of text.split(/\r?\n/)) {
    let line = raw.trim();
    if (!line) continue;
    if (line.startsWith("##")) {
      const label = line.slice(2).trim();
      if (label) items.push(group(label));
      continue;
    }
    let selected = false;
    let disabled = false;
    while (line[0] === "*" || line[0] === "!") {
      if (line[0] === "*") selected = true;
      else disabled = true;
      line = line.slice(1).trimStart();
    }
    const bar = line.indexOf("|");
    const label = (bar === -1 ? line : line.slice(0, bar)).trim();
    const value = bar === -1 ? "" : line.slice(bar + 1).trim();
    if (label) items.push(option(label, value, { selected, disabled }));
  }
  return items;
}

/** The list as text, the way `parseLines` reads it. */
export function toLines(items: SelectItem[]): string {
  return items
    .map((item) => {
      if (item.kind === "group") return `## ${item.label}`;
      const marks = `${item.selected ? "*" : ""}${item.disabled ? "!" : ""}`;
      return `${marks}${marks ? " " : ""}${item.label}${item.value ? ` | ${item.value}` : ""}`;
    })
    .join("\n");
}
