import { defineExtension } from "lenz-sdk";
import type { HtmlEditorApi } from "html-visual-editor/api";
import IconLibrary from "./IconLibrary.vue";
import styles from "./styles.css?inline";

export default defineExtension({
  activate(context) {
    const api = context.extensions.getExports<HtmlEditorApi>("html-visual-editor");

    const style = document.createElement("style");
    style.dataset.extension = context.extensionId;
    style.textContent = styles;
    document.head.append(style);
    context.subscriptions.push({ dispose: () => style.remove() });

    const library = context.windows.createWindow({
      id: "library",
      title: "Biblioteca de ícones",
      content: { type: "vue-component", component: IconLibrary, props: { api } },
      // At the right edge, so it does not cover the page that is being edited.
      x: Math.max(24, window.innerWidth - 544),
      y: 64,
      width: 520,
      height: 700,
      open: false,
    });
    context.subscriptions.push(library);

    // Listed in the view "Construtores de elementos" of the visual editor.
    context.subscriptions.push(
      api.registerBuilder({
        id: `${context.extensionId}.icons`,
        title: "Ícones",
        description:
          "Biblioteca de ícones SVG: busque, ajuste tamanho, cor e traço, e insira na página.",
        icon: "lucide:shapes",
        open: () => library.open(),
      }),
    );

    // The command is declared in package.json (`contributes.commands`); here is what it does.
    context.subscriptions.push(
      context.commands.registerCommand({
        id: `${context.extensionId}.open`,
        run: () => library.open(),
      }),
    );
  },
});
