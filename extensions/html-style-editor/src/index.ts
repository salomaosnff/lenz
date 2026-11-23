import { defineExtension } from "lenz-sdk";
import type { HtmlEditorApi } from "html-visual-editor/api";
import styles from "./styles.css?inline";
import LayoutView from "./LayoutView.vue";
import StyleGroupView from "./StyleGroupView.vue";
import { initWidgets } from "./widgets";
import { styleGroups } from "./model";

export default defineExtension({
  activate(context) {
    const api = context.extensions.getExports<HtmlEditorApi>("html-visual-editor");

    initWidgets(context, api);

    const style = document.createElement("style");
    style.dataset.extension = context.extensionId;
    style.textContent = styles;
    document.head.append(style);
    context.subscriptions.push({ dispose: () => style.remove() });

    // One view per group. They are declared in package.json (`contributes.views`, in the secondary
    // side bar, only while the visual editor is shown and an element is selected); this gives each
    // its content.
    for (const group of styleGroups) {
      const id = `html-style-editor.${group.id}`;
      context.subscriptions.push(
        context.views.registerViewProvider({
          viewId: id,
          resolveView: () => ({
            type: "vue-component",
            // Layout adapts to `display`, like Figma's auto layout; the others are plain field lists.
            component: group.id === "layout" ? LayoutView : StyleGroupView,
            props: { group, api },
          }),
        }),
      );
    }
  },
});
