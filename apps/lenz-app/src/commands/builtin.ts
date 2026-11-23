import { historyOf } from "../editor/history";
import { useEditorStore } from "../editor/store";
import { useLayoutStore } from "../layout/store";
import type { Command, Disposable } from "lenz-sdk";
import { registerKeybinding } from "../keybindings";
import { registerCommand } from ".";
import { openKeybindingsPage } from "../keybindings/page";
import { dismissAllNotifications } from "../notifications";
import { aboutOpen } from "./dialogs";
import { paletteOpen } from "./palette";

let registered: Disposable[] = [];

/** Asks for files with the browser's own picker and opens each one in a tab. */
function pickFiles() {
  const input = document.createElement("input");
  input.type = "file";
  input.multiple = true;
  input.addEventListener("change", async () => {
    for (const file of input.files ?? []) useEditorStore().open(file.name, await file.text());
  });
  input.click();
}

/** The app's own commands. Needs the stores, so call it after Pinia is installed. */
export function registerBuiltinCommands() {
  // Hot reload runs this again: drop the previous ones instead of failing on duplicates.
  registered.forEach((d) => d.dispose());
  const add = (command: Command) => registered.push(registerCommand(command));
  const bind = (key: string, command: string, when?: string) =>
    registered.push(registerKeybinding({ key, command, when }));
  registered = [];
  const layout = useLayoutStore();
  const editor = useEditorStore();

  const file = "Arquivo";
  const view = "Visualizar";
  add({
    id: "file.new",
    title: "Novo arquivo",
    category: file,
    icon: "lucide:file-plus",
    run: () => {
      // The first name nobody has taken yet.
      let n = 1;
      while (editor.tabs.some((t) => t.id === `sem-titulo-${n}.html`)) n++;
      editor.open(`sem-titulo-${n}.html`, "");
    },
  });
  add({
    id: "file.open",
    title: "Abrir arquivo…",
    category: file,
    icon: "lucide:folder-open",
    run: () => pickFiles(),
  });
  add({
    id: "file.save",
    title: "Salvar",
    category: file,
    icon: "lucide:save",
    when: "activeFile",
    run: () => editor.save(),
  });
  add({
    id: "file.saveAll",
    title: "Salvar tudo",
    category: file,
    icon: "lucide:save-all",
    run: () => editor.saveAll(),
  });
  add({
    id: "file.close",
    title: "Fechar o editor",
    category: file,
    icon: "lucide:x",
    when: "activeFile",
    run: () => editor.activeId && editor.close(editor.activeId),
  });
  add({
    id: "file.closeAll",
    title: "Fechar todos os editores",
    category: file,
    run: () => editor.closeAll(),
  });

  add({
    id: "view.toggleSidebar",
    title: "Alternar a barra lateral",
    category: view,
    icon: "lucide:panel-left",
    run: () => layout.toggleSidebar(),
  });
  add({
    id: "view.toggleSecondarySidebar",
    title: "Alternar o painel de propriedades",
    category: view,
    icon: "lucide:panel-right",
    run: () => layout.toggleSecondary(),
  });
  add({
    id: "view.resetViews",
    title: "Restaurar o layout das views",
    category: view,
    icon: "lucide:rotate-ccw",
    run: () => layout.resetViews(),
  });

  const history = () => (editor.activeTab ? historyOf(editor.activeTab) : undefined);
  add({
    id: "edit.undo",
    title: "Desfazer",
    category: "Editar",
    icon: "lucide:undo-2",
    when: "canUndo",
    run: () => history()?.undo(),
  });
  add({
    id: "edit.redo",
    title: "Refazer",
    category: "Editar",
    icon: "lucide:redo-2",
    when: "canRedo",
    run: () => history()?.redo(),
  });

  add({
    id: "workbench.commandPalette",
    title: "Mostrar a paleta de comandos",
    category: "Visualizar",
    icon: "lucide:terminal",
    run: () => (paletteOpen.value = !paletteOpen.value),
  });
  add({
    id: "workbench.keybindings",
    title: "Abrir os atalhos de teclado",
    category: "Visualizar",
    icon: "lucide:keyboard",
    run: () => openKeybindingsPage(),
  });
  add({
    id: "notifications.dismissAll",
    title: "Fechar todas as notificações",
    category: view,
    icon: "lucide:bell-off",
    run: () => dismissAllNotifications(),
  });
  add({
    id: "help.about",
    title: "Sobre o Lenz",
    category: "Ajuda",
    icon: "lucide:info",
    run: () => (aboutOpen.value = true),
  });
  add({
    id: "file.nextEditor",
    title: "Ir para o próximo editor",
    category: file,
    run: () => editor.cycle(1),
  });
  add({
    id: "file.previousEditor",
    title: "Ir para o editor anterior",
    category: file,
    run: () => editor.cycle(-1),
  });

  // Cmd on a Mac, Ctrl elsewhere.
  bind("Mod+Alt+N", "file.new");
  bind("Mod+O", "file.open");
  bind("Mod+S", "file.save", "activeFile");
  bind("Mod+Shift+S", "file.saveAll");
  // A page cannot take Ctrl+W, Ctrl+T, Ctrl+N or Ctrl+Tab from the browser (they close or switch
  // its tabs), so each of them has a shortcut that does reach the app. The last one is shown.
  bind("Mod+Alt+W", "file.close", "activeFile");
  bind("Ctrl+Tab", "file.nextEditor");
  bind("Ctrl+Shift+Tab", "file.previousEditor");
  bind("Alt+PageDown", "file.nextEditor");
  bind("Alt+PageUp", "file.previousEditor");
  // Typing in a field keeps its own undo (the app leaves Ctrl+Z to it); elsewhere these act on the file.
  bind("Mod+Z", "edit.undo");
  bind("Mod+Shift+Z", "edit.redo");
  bind("Mod+Y", "edit.redo");
  bind("Mod+B", "view.toggleSidebar");
  bind("Mod+Alt+B", "view.toggleSecondarySidebar");
  bind("Ctrl+K Ctrl+S", "workbench.keybindings");
  bind("Ctrl+Space", "workbench.commandPalette");
}
