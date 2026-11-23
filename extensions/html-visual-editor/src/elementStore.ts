import { markRaw } from "vue";
import catalogJson from "./html-elements.json";

/** A JSON Schema (draft 2020-12). After resolution it contains no `$ref`. */
export type JsonSchema = { [key: string]: unknown };

export interface AttributeDefinition {
  /** Friendly name, e.g. "Endereço do link". */
  label: string;
  description: string;
  /** The spec's own wording for the value (English). */
  specValue?: string;
  /** Schema of the value as written in markup, with every `$ref` inlined. */
  schema: JsonSchema;
  /** Absent = current. */
  status?: "obsolete" | "obsolete-conforming" | "deprecated";
  /** Only when the element is in this context. */
  condition?: string;
  /** Element-specific definition that replaces the global attribute of the same name. */
  overridesGlobal?: boolean;
  /** `input` only: the `type` values the attribute applies to. */
  inputTypes?: string[];
  [key: string]: unknown;
}

export type AttributeMap = Record<string, AttributeDefinition>;

export interface ElementDefinition {
  label: string;
  description: string;
  categories?: string[];
  parents?: string[];
  children?: string[];
  interface?: string;
  void?: boolean;
  syntax?: string;
  status?: "obsolete";
  namespace?: string;
  /** Attributes declared by the element itself (not the inherited global ones). */
  attributes: AttributeMap;
  [key: string]: unknown;
}

interface RawCatalog {
  $defs: Record<string, JsonSchema>;
  globalAttributes: AttributeMap;
  eventHandlerAttributes: AttributeMap;
  ariaAttributes: AttributeMap;
  globalAttributePatterns: Record<string, unknown>;
  elements: Record<string, ElementDefinition>;
  autonomousCustomElements: { attributes: AttributeMap; [key: string]: unknown };
}

const REF_PREFIX = "#/$defs/";

/** Valid custom element name: lowercase, starts with a letter, contains a hyphen. */
const isCustomElementName = (tag: string) => /^[a-z][^\sA-Z]*-[^\sA-Z]*$/.test(tag);

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

/**
 * Returns a copy of `node` with every `{ "$ref": "#/$defs/x" }` replaced by the definition `x`.
 * Keys next to the `$ref` (e.g. a more specific `description`) win over the definition's.
 */
function createResolver(defs: Record<string, JsonSchema>) {
  const resolvedDefs = new Map<string, unknown>();

  function resolveDef(name: string, trail: string[]): unknown {
    const cached = resolvedDefs.get(name);
    if (cached) return cached;
    const def = defs[name];
    if (!def) throw new Error(`html-elements.json: unknown $ref "${REF_PREFIX}${name}"`);
    if (trail.includes(name)) {
      throw new Error(`html-elements.json: circular $ref ${[...trail, name].join(" -> ")}`);
    }
    const resolved = resolve(def, [...trail, name]);
    resolvedDefs.set(name, resolved);
    return resolved;
  }

  function resolve(node: unknown, trail: string[] = []): unknown {
    if (Array.isArray(node)) return node.map((item) => resolve(item, trail));
    if (!node || typeof node !== "object") return node;

    const { $ref, ...rest } = node as { $ref?: unknown; [key: string]: unknown };
    const resolvedRest = Object.fromEntries(
      Object.entries(rest).map(([key, value]) => [key, resolve(value, trail)]),
    );
    if (typeof $ref !== "string") return resolvedRest;
    if (!$ref.startsWith(REF_PREFIX)) {
      throw new Error(`html-elements.json: unsupported $ref "${$ref}"`);
    }
    return { ...(resolveDef($ref.slice(REF_PREFIX.length), trail) as object), ...resolvedRest };
  }

  return resolve;
}

/** Inlines the `$ref`s of the `schema` (and the other nested schemas) of every attribute. */
function resolveAttributes(
  attributes: AttributeMap,
  resolve: (node: unknown) => unknown,
): AttributeMap {
  return Object.fromEntries(
    Object.entries(attributes).map(([name, attribute]) => [
      name,
      { ...attribute, schema: resolve(attribute.schema) as JsonSchema },
    ]),
  );
}

function buildCatalog(raw: RawCatalog) {
  const resolve = createResolver(raw.$defs);

  // Everything every HTML element accepts: global, event handler and ARIA attributes.
  const globalAttributes: AttributeMap = {
    ...resolveAttributes(raw.globalAttributes, resolve),
    ...resolveAttributes(raw.eventHandlerAttributes, resolve),
    ...resolveAttributes(raw.ariaAttributes, resolve),
  };

  const elements = Object.fromEntries(
    Object.entries(raw.elements).map(([tag, element]) => [
      tag,
      { ...element, attributes: resolveAttributes(element.attributes, resolve) },
    ]),
  ) as Record<string, ElementDefinition>;

  return deepFreeze({
    globalAttributes,
    globalAttributePatterns: resolve(raw.globalAttributePatterns) as Record<string, unknown>,
    elements,
    customElementAttributes: resolveAttributes(raw.autonomousCustomElements.attributes, resolve),
  });
}

function createElementStore() {
  // Plain data that never changes: no need for Vue to make it reactive.
  const catalog = markRaw(buildCatalog(catalogJson as unknown as RawCatalog));
  const cache = new Map<string, AttributeMap | undefined>();

  /** All known tag names (lowercase), including the obsolete ones. */
  const tags = Object.keys(catalog.elements);

  const normalize = (tag: string) => tag.trim().toLowerCase();

  function getElement(tag: string): ElementDefinition | undefined {
    const name = normalize(tag);
    return Object.hasOwn(catalog.elements, name) ? catalog.elements[name] : undefined;
  }

  /** Attributes accepted by every element (global, event handlers and ARIA). */
  function getGlobalAttributes(): AttributeMap {
    return catalog.globalAttributes;
  }

  /**
   * Every attribute `tag` accepts, keyed by attribute name: the global attributes (including
   * event handlers and ARIA) plus the ones the element declares. When the element redefines a
   * global attribute (e.g. `title` on `abbr`, `dir` on `bdo`), the element's definition wins.
   *
   * Returns `undefined` for an unknown tag. A custom element name (with a hyphen) gets the
   * global attributes. Entries are frozen: copy them before changing anything.
   */
  function getAttributesOfElement(tag: string): AttributeMap | undefined {
    const name = normalize(tag);
    if (cache.has(name)) return cache.get(name);

    const element = Object.hasOwn(catalog.elements, name) ? catalog.elements[name] : undefined;
    const attributes = element
      ? { ...catalog.globalAttributes, ...element.attributes }
      : isCustomElementName(name)
        ? { ...catalog.globalAttributes }
        : undefined;

    const result = attributes && Object.freeze(attributes);
    cache.set(name, result);
    return result;
  }

  return { tags, getElement, getGlobalAttributes, getAttributesOfElement };
}

let store: ReturnType<typeof createElementStore> | undefined;

/** Shared instance. The catalog is built (and its `$ref`s resolved) on first use. */
export function useElementStore() {
  return (store ??= createElementStore());
}
