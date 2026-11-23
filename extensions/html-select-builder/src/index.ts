import { defineExtension } from "lenz-sdk";
import type { HtmlEditorApi } from "html-visual-editor/api";
import SelectBuilder from "./SelectBuilder.vue";
import styles from "./styles.css?inline";

export default defineExtension({
  activate(context) {
    const api = context.extensions.getExports<HtmlEditorApi>("html-visual-editor");

    const style = document.createElement("style");
    style.dataset.extension = context.extensionId;
    style.textContent = styles;
    document.head.append(style);
    context.subscriptions.push({ dispose: () => style.remove() });

    const builder = context.windows.createWindow({
      id: "builder",
      title: "Construtor de select",
      content: { type: "vue-component", component: SelectBuilder, props: { api } },
      // At the right edge, so it does not cover the page that is being edited.
      x: Math.max(24, window.innerWidth - 544),
      y: 64,
      width: 520,
      height: 660,
      open: false,
    });
    context.subscriptions.push(builder);

    // Listed in the view "Construtores de elementos" of the visual editor.
    context.subscriptions.push(
      api.registerBuilder({
        id: `${context.extensionId}.select`,
        title: "Select",
        description: "Monta listas de seleção: opções, grupos, múltipla escolha e estilo.",
        icon: "lucide:square-chevron-down",
        open: () => builder.open(),
      }),
    );

    // The command is declared in package.json (`contributes.commands`); here is what it does.
    context.subscriptions.push(
      context.commands.registerCommand({
        id: `${context.extensionId}.open`,
        run: () => builder.open(),
      }),
    );
  },
});
