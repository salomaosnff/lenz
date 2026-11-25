import { toolOutput, type Disposable, type ExtensionContext } from "lenz-sdk";
import { builders } from "../builders";
import { collectCssVariables } from "../cssColorResolve";
import { useElementStore } from "../elementStore";
import {
  POSITIONS,
  describeElement,
  duplicateElement,
  insertElement,
  moveElement,
  parseDeclarations,
  removeElement,
  reorderElement,
  selectChildren,
  selectElement,
  selectParent,
  setAttributes,
  setHtml,
  setStyles,
  setText,
} from "./edit";
import { anyText, choice, flag, integer, optionalText, record, text, type Input } from "./input";
import { changeRule, listRules } from "./rules";
import { checkWidths } from "./safety";
import { capture } from "./screenshot";
import { activeSession, idOf, resolveElement } from "./target";
import { contentChildren, describeTree } from "./tree";

const target = (input: Input) => optionalText(input, "target");

/**
 * What each tool does, by name. What an agent is told about them (the description and the shape of
 * what they take) is in `package.json`, `contributes.tools`: the app lists them before this runs.
 */
export const implementations: Record<string, (input: Input) => unknown> = {
  get_element_tree(input) {
    const page = activeSession();
    const root =
      target(input) === undefined ? page.root.value : resolveElement(page, target(input));
    const budget = { left: integer(input, "maxNodes", 1, 1000) ?? 200, truncated: false };
    const tree = describeTree(
      root,
      new Set(page.selection.value),
      integer(input, "depth", 0, 12) ?? 4,
      budget,
    );
    return {
      selected: page.selection.value.map(idOf),
      ...(budget.truncated && {
        truncated:
          "Some elements are not listed: ask for one of them as the target, or raise depth and maxNodes.",
      }),
      tree,
    };
  },

  get_element: (input) => {
    const page = activeSession();
    return describeElement(resolveElement(page, target(input)));
  },

  select_element(input) {
    const page = activeSession();
    return selectElement(
      page,
      resolveElement(page, text(input, "target")),
      flag(input, "additive"),
    );
  },

  select_parent(input) {
    const page = activeSession();
    return selectParent(page, resolveElement(page, target(input)));
  },

  select_children(input) {
    const page = activeSession();
    const el =
      target(input) === undefined && !page.selected.value
        ? page.root.value
        : resolveElement(page, target(input));
    return selectChildren(page, el, contentChildren(el));
  },

  insert_element(input) {
    const page = activeSession();
    const ref =
      target(input) === undefined && !page.selected.value
        ? page.root.value
        : resolveElement(page, target(input));
    return insertElement(page, ref, choice(input, "position", POSITIONS, "append"), {
      tag: optionalText(input, "tag"),
      html: optionalText(input, "html"),
      text: input.text === undefined ? undefined : anyText(input, "text"),
      attributes: input.attributes === undefined ? undefined : record(input, "attributes"),
      styles: input.styles === undefined ? undefined : record(input, "styles"),
      select: flag(input, "select", true),
    });
  },

  set_text(input) {
    const page = activeSession();
    return setText(
      page,
      resolveElement(page, target(input)),
      anyText(input, "text"),
      flag(input, "replaceChildren"),
    );
  },

  set_html(input) {
    const page = activeSession();
    return setHtml(page, resolveElement(page, target(input)), anyText(input, "html"));
  },

  set_attributes(input) {
    const page = activeSession();
    return setAttributes(page, resolveElement(page, target(input)), record(input, "attributes"));
  },

  set_styles(input) {
    const page = activeSession();
    return setStyles(page, resolveElement(page, target(input)), record(input, "styles"));
  },

  move_element(input) {
    const page = activeSession();
    return moveElement(
      page,
      resolveElement(page, target(input)),
      resolveElement(page, text(input, "to")),
      choice(input, "position", POSITIONS, "append"),
    );
  },

  reorder_element(input) {
    const page = activeSession();
    return reorderElement(
      page,
      resolveElement(page, target(input)),
      choice(input, "direction", ["up", "down"] as const, "up"),
    );
  },

  remove_element(input) {
    const page = activeSession();
    return removeElement(page, resolveElement(page, target(input)));
  },

  duplicate_element(input) {
    const page = activeSession();
    return duplicateElement(page, resolveElement(page, target(input)));
  },

  get_tag_reference(input) {
    const store = useElementStore();
    const tag = text(input, "tag").trim().toLowerCase();
    const element = store.getElement(tag);
    const attributes = store.getAttributesOfElement(tag);
    if (!attributes) return { tag, known: false };
    const brief = (value: string, max = 200) =>
      value.length > max ? `${value.slice(0, max)}…` : value;
    const own = element?.attributes ?? {};
    return {
      tag,
      known: !!element,
      ...(element && {
        label: element.label,
        description: brief(element.description, 400),
        void: !!element.void,
        categories: element.categories,
        parents: element.parents,
        children: element.children,
      }),
      attributes: Object.entries(own).map(([name, def]) => {
        const values = (def.schema as { enum?: unknown[] }).enum;
        return {
          name,
          label: def.label,
          description: brief(def.description),
          ...(values && { values }),
        };
      }),
      globalAttributes: Object.keys(store.getGlobalAttributes()).filter(
        (name) => !name.startsWith("on") && !name.startsWith("aria-"),
      ),
    };
  },

  get_css_variables(input) {
    const page = activeSession();
    const el =
      target(input) === undefined && !page.selected.value
        ? page.root.value
        : resolveElement(page, target(input));
    return { variables: collectCssVariables(el) };
  },

  list_builders: () => ({
    builders: builders.map(({ id, title, description }) => ({ id, title, description })),
  }),

  open_builder(input) {
    const id = text(input, "id");
    const builder = builders.find((b) => b.id === id);
    if (!builder) throw new Error(`There is no builder "${id}". See list_builders.`);
    builder.open();
    return { opened: id, note: "It opens a window for the user, who finishes it there." };
  },

  get_style_rules(input) {
    const page = activeSession();
    return { rules: listRules(page.root.value.ownerDocument, optionalText(input, "selector")) };
  },

  set_style_rule(input) {
    const page = activeSession();
    const doc = page.root.value.ownerDocument;
    const remove = flag(input, "remove");
    const declarations =
      input.styles === undefined ? [] : parseDeclarations(doc, record(input, "styles"));
    if (!remove && !declarations.length)
      throw new Error('Pass "styles", or "remove" to delete the rule.');
    const result = changeRule(doc, {
      selector: text(input, "selector"),
      media: optionalText(input, "media"),
      declarations,
      remove,
    });
    page.commit(`Agente: regra ${result.selector}`);
    return result;
  },

  async screenshot(input) {
    const page = activeSession();
    const widths = checkWidths(input.widths, [1280, 768, 375]);
    const scale = input.scale === undefined ? 1 : Number(input.scale);
    if (!(scale >= 0.25 && scale <= 2)) throw new Error('"scale" must be a number from 0.25 to 2.');
    const { shots, warnings } = await capture(page.root.value.ownerDocument, widths, {
      maxHeight: integer(input, "maxHeight", 200, 8000) ?? 4000,
      scale,
    });
    return toolOutput(
      {
        screenshots: shots.map(({ width, height }) => ({ width, height })),
        note: "The images come in the order of the screenshots above.",
        ...(warnings.length && { warnings }),
      },
      shots.map(({ data }) => ({ data, mimeType: "image/png" })),
    );
  },
};

/** Gives the declared tools (`contributes.tools`) what they do. */
export function registerAgentTools(context: ExtensionContext): Disposable[] {
  return Object.entries(implementations).map(([name, execute]) =>
    context.tools.registerTool({ name, execute: (input) => execute(input) }),
  );
}
