import { commonAttributesOf } from "./commonAttributes";
import { useElementStore, type AttributeDefinition, type JsonSchema } from "./elementStore";

export interface FieldKind {
  kind: "boolean" | "enum" | "number" | "text";
  /** Fixed choices (`enum`) or suggestions (`text`). */
  options?: string[];
  /** `number` only. */
  integer?: boolean;
  min?: number;
}

/** Attributes the panel handles elsewhere or that are always shown first. */
export const PINNED = ["id", "class"];
const HIDDEN = new Set(["style"]);

const asList = (value: unknown) => (Array.isArray(value) ? (value as unknown[]) : []);

/** Every literal value a schema accepts, or `null` when it also accepts free text. */
function literals(schema: JsonSchema): string[] | null {
  if (Array.isArray(schema.enum)) return schema.enum.map(String);
  if ("const" in schema) return [String(schema.const)];
  const alternatives = asList(schema.anyOf ?? schema.oneOf) as JsonSchema[];
  if (alternatives.length === 0) return null;
  const parts = alternatives.map(literals);
  return parts.every(Boolean) ? (parts.flat() as string[]) : null;
}

/** Literal values that appear next to free-text alternatives (used as suggestions). */
function suggestions(schema: JsonSchema): string[] {
  const alternatives = asList(schema.anyOf ?? schema.oneOf) as JsonSchema[];
  return alternatives.flatMap((alternative) => literals(alternative) ?? []).filter(Boolean);
}

/** Picks the control that fits an attribute's (already resolved) schema. */
export function fieldKind(schema: JsonSchema): FieldKind {
  if (schema.type === "boolean") return { kind: "boolean" };
  const fixed = literals(schema);
  if (fixed) return { kind: "enum", options: fixed };
  if (schema.type === "integer" || schema.type === "number") {
    return {
      kind: "number",
      integer: schema.type === "integer",
      min: typeof schema.minimum === "number" ? schema.minimum : undefined,
    };
  }
  const options = suggestions(schema);
  return options.length ? { kind: "text", options } : { kind: "text" };
}

/** Value to use when the user adds the attribute. */
export function defaultValue(schema: JsonSchema): string {
  const field = fieldKind(schema);
  if (field.kind !== "enum") return "";
  // An empty value is valid (e.g. `hidden`), so it is the neutral choice; otherwise the first option.
  return field.options?.includes("") ? "" : (field.options?.[0] ?? "");
}

export interface PropertyOption {
  name: string;
  label: string;
  description: string;
}
export interface PropertyGroup {
  label: string;
  items: PropertyOption[];
}

/** Attributes of `el` that can still be added, grouped for the "add" select. */
export function addableProperties(el: Element, present: Set<string>): PropertyGroup[] {
  const store = useElementStore();
  const tag = el.tagName.toLowerCase();
  const all = store.getAttributesOfElement(tag);
  if (!all) return [];
  const own = store.getElement(tag)?.attributes ?? {};
  const inputType = tag === "input" ? (el.getAttribute("type") ?? "text").toLowerCase() : null;

  const groups: Record<string, PropertyOption[]> = {
    common: [],
    own: [],
    global: [],
    events: [],
    aria: [],
  };
  const common = commonAttributesOf(tag);
  for (const [name, definition] of Object.entries(all)) {
    if (present.has(name) || HIDDEN.has(name) || PINNED.includes(name)) continue;
    if (definition.status === "obsolete") continue;
    if (inputType && definition.inputTypes && !definition.inputTypes.includes(inputType)) continue;
    const group = common.includes(name)
      ? "common"
      : name.startsWith("aria-")
        ? "aria"
        : name.startsWith("on")
          ? "events"
          : name in own
            ? "own"
            : "global";
    groups[group]!.push({ name, label: definition.label, description: definition.description });
  }
  const byLabel = (a: PropertyOption, b: PropertyOption) => a.label.localeCompare(b.label, "pt-BR");
  // "Comum" keeps the curated order (most useful first) instead of alphabetical.
  groups.common!.sort((a, b) => common.indexOf(a.name) - common.indexOf(b.name));
  return [
    { label: "Comum", items: groups.common! },
    { label: `Do elemento <${tag}>`, items: groups.own!.sort(byLabel) },
    { label: "Gerais", items: groups.global!.sort(byLabel) },
    { label: "Eventos", items: groups.events!.sort(byLabel) },
    { label: "Acessibilidade (ARIA)", items: groups.aria!.sort(byLabel) },
  ].filter((group) => group.items.length);
}

export interface PropertyEntry {
  name: string;
  value: string;
  definition: AttributeDefinition | undefined;
  pinned: boolean;
}

/** Attributes to show as fields: the pinned ones first, then the others in document order. */
export function presentProperties(el: Element): PropertyEntry[] {
  const definitions = useElementStore().getAttributesOfElement(el.tagName.toLowerCase());
  const entry = (name: string, pinned: boolean): PropertyEntry => ({
    name,
    value: el.getAttribute(name) ?? "",
    definition: definitions?.[name],
    pinned,
  });
  const others = el.getAttributeNames().filter((n) => !PINNED.includes(n) && !HIDDEN.has(n));
  return [...PINNED.map((name) => entry(name, true)), ...others.map((name) => entry(name, false))];
}
