import { reactive, ref, shallowRef } from "vue";
import { defineStore } from "pinia";
import { useEditorStore, setTabPersister } from "../editor/store";
import { notifications } from "../notifications";
import { prompts } from "../prompts";
import { OpfsFileSystem } from "./opfs";
import { htmlTemplate, isHtmlFile } from "./sample";
import {
  FileSystemError,
  exists,
  readTextFile,
  writeTextFile,
  type FileSystemProvider,
  type FileType,
} from "./types";
import { basename, dirname, joinPath, normalizePath, splitPath } from "./path";
import { downloadBlob, zipFileSystem } from "./zip";

const describe = (error: unknown) =>
  error instanceof Error && error.message ? error.message : String(error);

/**
 * The project: everything lives in the site's private storage (OPFS), which the explorer
 * shows. Saving a tab that came from it writes back; any other tab (a new file, or one
 * from the browser's file picker) is only marked as saved.
 */
export const useWorkspaceStore = defineStore("workspace", () => {
  const fs = shallowRef<FileSystemProvider>();
  /** Why there is no project, when there is not. */
  const error = ref<string>();
  /** Ids of the tabs that belong to `fs`. */
  const bound = new Set<string>();
  /** Bumped when files change, so the tree reads its directories again. */
  const revision = ref(0);
  /** The directories open in the tree, by path. */
  const expanded = reactive(new Set<string>());

  const refresh = () => void revision.value++;

  /** Opens a directory in the tree, and the ones above it. */
  function expand(path: string) {
    const segments = splitPath(path);
    for (let i = 1; i <= segments.length; i++) expanded.add(segments.slice(0, i).join("/"));
  }

  function toggle(path: string) {
    if (!expanded.delete(path)) expanded.add(path);
  }

  /** Opens the project's storage. Call it once, when the app starts. */
  async function init() {
    if (fs.value) return;
    if (!OpfsFileSystem.isSupported()) {
      error.value = "Este navegador não oferece armazenamento privado do site.";
      return;
    }
    try {
      const opfs = await OpfsFileSystem.open("Projeto");
      fs.value = opfs;
    } catch (e) {
      error.value = `Não foi possível abrir o projeto: ${describe(e)}`;
    }
  }

  /** Downloads the whole project as a zip, with what is open saved first. */
  async function download() {
    const provider = fs.value;
    if (!provider) return;
    await attempt("baixar o projeto", async () => {
      await useEditorStore().saveAll();
      downloadBlob(await zipFileSystem(provider), "projeto-lenz.zip");
    });
  }

  async function openFile(path: string) {
    const provider = fs.value;
    if (!provider) return;
    const id = normalizePath(path);
    const editor = useEditorStore();
    const existing = editor.tabs.find((t) => t.id === id);
    if (existing && bound.has(id)) return editor.activate(id);
    if (existing) {
      // Another file with this name, not from here. Replace it unless it has unsaved work.
      if (editor.isDirty(existing)) {
        editor.activate(id);
        void notifications.showWarningMessage(
          `Já há um arquivo aberto e não salvo chamado "${id}". Salve ou feche-o antes.`,
        );
        return;
      }
      editor.close(id);
    }
    try {
      const content = await readTextFile(provider, id);
      // The folder may have changed while the file was being read.
      if (fs.value !== provider) return;
      editor.open(id, content);
      bound.add(id);
    } catch (error) {
      void notifications.showErrorMessage(
        error instanceof TypeError
          ? `"${id}" não é um arquivo de texto.`
          : `Não foi possível abrir "${id}": ${describe(error)}`,
      );
    }
  }

  /** What a save of a tab does: write it, if the tab is from the file system. */
  async function persist(id: string, content: string): Promise<void> {
    const provider = fs.value;
    if (!provider || !bound.has(id)) return;
    try {
      await writeTextFile(provider, id, content);
    } catch (error) {
      void notifications.showErrorMessage(
        error instanceof FileSystemError && error.code === "Denied"
          ? `Sem permissão para salvar "${id}".`
          : `Não foi possível salvar "${id}": ${describe(error)}`,
      );
      // The tab stays unsaved.
      throw error;
    }
  }

  /** Called when a tab is closed, so a later file with the same name starts clean. */
  const forget = (id: string) => bound.delete(id);

  setTabPersister(persist, forget);

  // ---- Changing files. `path` is where the user pointed; `""` is the root. ----

  const isUnder = (id: string, path: string) => id === path || id.startsWith(`${path}/`);
  const tabsUnder = (path: string) => {
    const editor = useEditorStore();
    return editor.tabs.filter((t) => bound.has(t.id) && isUnder(t.id, path));
  };

  /** Why this name cannot be used in `parent`, or nothing if it can. */
  async function nameProblem(
    provider: FileSystemProvider,
    parent: string,
    value: string,
    options: { single?: boolean; own?: string } = {},
  ): Promise<string | undefined> {
    const name = value.trim();
    if (!name) return "Digite um nome.";
    let segments: string[];
    try {
      segments = splitPath(name);
    } catch {
      return "Nome inválido.";
    }
    if (!segments.length) return "Nome inválido.";
    if (options.single && segments.length > 1) return "O nome não pode conter /.";
    const path = joinPath(parent, name);
    if (path === options.own) return undefined;
    try {
      if (await exists(provider, path)) return "Já existe um item com esse nome.";
    } catch (error) {
      if (error instanceof FileSystemError && error.code === "NotADirectory") {
        return "Um item neste caminho é um arquivo, não uma pasta.";
      }
      throw error;
    }
    return undefined;
  }

  async function attempt(action: string, run: () => Promise<void>) {
    try {
      await run();
    } catch (error) {
      void notifications.showErrorMessage(`Não foi possível ${action}: ${describe(error)}`);
    }
  }

  /** Asks for a name, and creates a file there; the name may have folders (`a/b.html`). */
  async function createFile(parent = "") {
    const provider = fs.value;
    if (!provider) return;
    const name = await prompts.showInputBox({
      title: "Novo arquivo",
      prompt: parent ? `Em ${parent}` : "Na raiz",
      placeHolder: "pagina.html",
      validateInput: (value) => nameProblem(provider, parent, value),
    });
    if (name === undefined || fs.value !== provider) return;
    const path = joinPath(parent, name);
    await attempt("criar o arquivo", async () => {
      await writeTextFile(provider, path, isHtmlFile(path) ? htmlTemplate(path) : "");
      expand(dirname(path));
      refresh();
      await openFile(path);
    });
  }

  async function createFolder(parent = "") {
    const provider = fs.value;
    if (!provider) return;
    const name = await prompts.showInputBox({
      title: "Nova pasta",
      prompt: parent ? `Em ${parent}` : "Na raiz",
      placeHolder: "pasta",
      validateInput: (value) => nameProblem(provider, parent, value),
    });
    if (name === undefined || fs.value !== provider) return;
    const path = joinPath(parent, name);
    await attempt("criar a pasta", async () => {
      await provider.createDirectory(path);
      expand(path);
      refresh();
    });
  }

  /** Renames a file or folder. Files open from it are closed and opened again with the new name. */
  async function rename(path: string) {
    const provider = fs.value;
    const from = normalizePath(path);
    if (!provider || !from) return;
    const editor = useEditorStore();
    const affected = tabsUnder(from);
    if (affected.some((tab) => editor.isDirty(tab))) {
      void notifications.showWarningMessage(
        `"${basename(from)}" tem alterações não salvas. Salve ou feche antes de renomear.`,
      );
      return;
    }
    const parent = dirname(from);
    const current = basename(from);
    const dot = current.lastIndexOf(".");
    const name = await prompts.showInputBox({
      title: "Renomear",
      value: current,
      // The extension stays out of the selection.
      valueSelection: [0, dot > 0 ? dot : current.length],
      validateInput: (value) => nameProblem(provider, parent, value, { single: true, own: from }),
    });
    if (name === undefined || fs.value !== provider) return;
    const to = joinPath(parent, name);
    if (to === from) return;
    await attempt("renomear", async () => {
      const reopen = affected.map((t) => t.id);
      const active = editor.activeId;
      await provider.rename(from, to);
      reopen.forEach((id) => editor.close(id));
      // Folders open in the tree keep their place under the new name.
      for (const open of Array.from(expanded)) {
        if (isUnder(open, from)) {
          expanded.delete(open);
          expanded.add(to + open.slice(from.length));
        }
      }
      refresh();
      for (const id of reopen) await openFile(to + id.slice(from.length));
      if (active && reopen.includes(active)) editor.activate(to + active.slice(from.length));
    });
  }

  /** Deletes a file or a folder with everything in it, after the user confirms. */
  async function remove(path: string, type: FileType = "file") {
    const provider = fs.value;
    const target = normalizePath(path);
    if (!provider || !target) return;
    const editor = useEditorStore();
    const affected = tabsUnder(target);
    const unsaved = affected.some((tab) => editor.isDirty(tab));
    const answer = await notifications.showWarningMessage(
      type === "directory"
        ? `Excluir a pasta "${basename(target)}" e tudo que há nela?`
        : `Excluir "${basename(target)}"?`,
      {
        modal: true,
        detail: `Não é possível desfazer.${unsaved ? " Alterações não salvas serão perdidas." : ""}`,
      },
      "Excluir",
    );
    if (answer !== "Excluir" || fs.value !== provider) return;
    await attempt("excluir", async () => {
      await provider.delete(target, { recursive: true });
      affected.forEach((tab) => editor.close(tab.id));
      for (const open of Array.from(expanded)) if (isUnder(open, target)) expanded.delete(open);
      refresh();
    });
  }

  async function copyPath(path: string) {
    try {
      await navigator.clipboard.writeText(normalizePath(path));
    } catch {
      void notifications.showWarningMessage("Não foi possível copiar o caminho.");
    }
  }

  /** Whether a tab was opened from the project, so a save writes it there. */
  const isFileBacked = (id: string) => bound.has(id);

  return {
    fs,
    error,
    isFileBacked,
    revision,
    expanded,
    refresh,
    toggle,
    init,
    download,
    openFile,
    createFile,
    createFolder,
    rename,
    remove,
    copyPath,
  };
});
