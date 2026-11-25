import { watchEffect, shallowReadonly } from "vue";
import { defineExtension } from "lenz-sdk";
import styles from "./styles.css?inline";
import ColorInput from "./ColorInput.vue";
import HtmlEditor from "./HtmlEditor.vue";
import AttributesView from "./AttributesView.vue";
import BuildersView from "./BuildersView.vue";
import { builders, registerBuilder } from "./builders";
import ElementsView from "./ElementsView.vue";
import LayersView from "./LayersView.vue";
import {
  ATTRIBUTES_VIEW_ID,
  BUILDERS_VIEW_ID,
  ELEMENTS_VIEW_ID,
  CAN_EDIT_ATTRIBUTES_KEY,
  CAN_EDIT_ELEMENTS_KEY,
  HAS_SELECTION_KEY,
  LAYERS_VIEW_ID,
  VISUAL_EDITOR_ID,
  type HtmlEditorApi,
} from "./api";
import { palette } from "./model";
import { JUSTIFY, NEW_DIV, TEXT_ALIGN, nextInCycle, toggleFlex } from "./shortcuts";
import { session } from "./session";
import { registerAgentTools } from "./agent/tools";

export default defineExtension<HtmlEditorApi>({
  activate(context) {
    // Extension CSS is bundled as a string; the host does not load stylesheets for extensions.
    const style = document.createElement("style");
    style.dataset.extension = context.extensionId;
    style.textContent = styles;
    document.head.append(style);
    context.subscriptions.push({ dispose: () => style.remove() });

    context.subscriptions.push(
      // The editor (its label, icon, files and priority) is declared in package.json
      // (`contributes.editors`); this gives it its content.
      context.editors.registerEditorProvider({
        id: VISUAL_EDITOR_ID,
        resolveEditor: ({ document }) => ({
          type: "vue-component",
          component: HtmlEditor,
          props: { document },
        }),
      }),
    );

    // The views are declared in package.json (`contributes.views`); these give them their content.
    context.subscriptions.push(
      context.views.registerViewProvider({
        viewId: LAYERS_VIEW_ID,
        resolveView: () => ({ type: "vue-component", component: LayersView }),
      }),
      context.views.registerViewProvider({
        viewId: ELEMENTS_VIEW_ID,
        resolveView: () => ({ type: "vue-component", component: ElementsView }),
      }),
      context.views.registerViewProvider({
        viewId: BUILDERS_VIEW_ID,
        resolveView: () => ({ type: "vue-component", component: BuildersView }),
      }),
      context.views.registerViewProvider({
        viewId: ATTRIBUTES_VIEW_ID,
        resolveView: () => ({ type: "vue-component", component: AttributesView }),
      }),
    );

    // The commands and their shortcuts are declared in package.json (`contributes.commands` and
    // `contributes.keybindings`): their title, icon, `when` and keys live there. Here is what each does.
    const act = (run: (s: NonNullable<typeof session.value>) => void) => () =>
      session.value && run(session.value);
    // Style shortcuts act on the selected element, through its own `style`.
    const onStyle = (
      run: (
        el: HTMLElement,
        computed: CSSStyleDeclaration,
        set: (prop: string, value: string) => void,
      ) => void,
    ) =>
      act((s) => {
        const el = s.selected.value;
        if (el) run(el, el.ownerDocument.defaultView!.getComputedStyle(el), s.setStyle);
      });
    const commands: Record<string, () => void> = {
      selectAll: act((s) => s.selectAll()),
      createDiv: act((s) => s.insert(NEW_DIV)),
      toggleFlex: onStyle((el, computed, set) =>
        set("display", toggleFlex(el.style.getPropertyValue("display"), computed.display)),
      ),
      cycleJustify: onStyle((el, _, set) =>
        set("justify-content", nextInCycle(JUSTIFY, el.style.getPropertyValue("justify-content"))),
      ),
      cycleTextAlign: onStyle((el, _, set) =>
        set("text-align", nextInCycle(TEXT_ALIGN, el.style.getPropertyValue("text-align"))),
      ),
      setGrid: onStyle((_, __, set) => set("display", "grid")),
      stretch: onStyle((_, __, set) => set("flex", "1")),
      selectParent: act((s) => s.selectParent()),
      moveUp: act((s) => s.move(-1)),
      moveDown: act((s) => s.move(1)),
      duplicate: act((s) => s.duplicate()),
      remove: act((s) => s.remove()),
      // One per element of the palette: `insert.heading`, `insert.text`...
      ...Object.fromEntries(
        palette.map((item) => [`insert.${item.id}`, act((s) => s.insert(item.html))]),
      ),
    };
    for (const [name, run] of Object.entries(commands)) {
      context.subscriptions.push(
        context.commands.registerCommand({ id: `${context.extensionId}.${name}`, run }),
      );
    }

    // The tools for AI agents are declared in package.json (`contributes.tools`); these give them
    // what they do.
    context.subscriptions.push(...registerAgentTools(context));

    // Lets other extensions' views use `when: "html-visual-editor.hasSelection"`.
    const stop = watchEffect(() => {
      const current = session.value;
      const items = current?.selection.value ?? [];
      const page = current?.root.value;
      context.contextKeys.set(HAS_SELECTION_KEY, items.length > 0);
      // Attributes (id, class...) belong to one element; the commands work on all of them.
      context.contextKeys.set(CAN_EDIT_ATTRIBUTES_KEY, items.length === 1 && items[0] !== page);
      context.contextKeys.set(CAN_EDIT_ELEMENTS_KEY, items.length > 0 && !items.includes(page!));
    });
    context.subscriptions.push({ dispose: stop });

    return { session: shallowReadonly(session), ColorInput, registerBuilder, builders };
  },
});
