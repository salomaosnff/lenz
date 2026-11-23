import { defineExtension } from "lenz-sdk";
import type { HtmlEditorApi } from "html-visual-editor/api";
import TableBuilder from "./TableBuilder.vue";
import { defaultOptions, renderTable } from "./table";
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
      title: "Construtor de tabelas",
      content: { type: "vue-component", component: TableBuilder, props: { api } },
      // At the right edge, so it does not cover the cells of the page that are to be clicked.
      x: Math.max(24, window.innerWidth - 544),
      y: 64,
      width: 520,
      height: 640,
      open: false,
    });
    context.subscriptions.push(builder);

    // Listed in the view "Construtores de elementos" of the visual editor.
    context.subscriptions.push(
      api.registerBuilder({
        id: `${context.extensionId}.table`,
        title: "Tabela",
        description: "Monta tabelas: tamanho, cabeçalho, rodapé, legenda e estilo.",
        icon: "lucide:table",
        open: () => builder.open(),
      }),
    );

    // The commands are declared in package.json (`contributes.commands`); here is what each does.
    const commands: Record<string, () => void> = {
      open: () => builder.open(),
      insertDefault: () => api.session.value?.insert(renderTable(defaultOptions())),
    };
    for (const [name, run] of Object.entries(commands)) {
      context.subscriptions.push(
        context.commands.registerCommand({ id: `${context.extensionId}.${name}`, run }),
      );
    }
  },
});
