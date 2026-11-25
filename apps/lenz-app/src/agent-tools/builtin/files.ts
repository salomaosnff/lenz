import { documentFor } from "../../editor/document";
import { useEditorStore } from "../../editor/store";
import { exists, readTextFile, writeTextFile, type FileSystemProvider } from "../../fs/types";
import { joinPath, normalizePath, splitPath } from "../../fs/path";
import { useWorkspaceStore } from "../../fs/workspace";
import {
  boolean,
  content,
  flag,
  integer,
  optionalInteger,
  optionalText,
  schema,
  string,
  text,
  type Input,
  type Tools,
} from "./input";

/** A file bigger than this is not read into a reply: it would only drown the agent. */
const MAX_FILE_BYTES = 1_000_000;

/** The project's file system, or why there is none. */
function projectFs(): FileSystemProvider {
  const workspace = useWorkspaceStore();
  if (!workspace.fs) throw new Error(workspace.error ?? "The project is not open yet.");
  return workspace.fs;
}

/** A path of the project, without `..` and with the extra slashes gone. `""` is the root. */
const pathOf = (input: Input, key = "path") => normalizePath(text(input, key));
const optionalPathOf = (input: Input, key = "path") =>
  optionalText(input, key) === undefined ? "" : pathOf(input, key);

const pathProperty = (what = "Path of the file or folder in the project, e.g. src/page.html.") =>
  string(what);

interface Listed {
  path: string;
  type: "file" | "directory";
}

/** Everything under a directory, folders before the files they hold, up to `limit` entries. */
async function walk(fs: FileSystemProvider, root: string, recursive: boolean, limit: number) {
  const found: Listed[] = [];
  const pending = [root];
  while (pending.length) {
    const directory = pending.shift()!;
    for (const entry of await fs.readDirectory(directory)) {
      if (found.length >= limit) return { found, truncated: true };
      const path = joinPath(directory, entry.name);
      found.push({ path, type: entry.type });
      if (recursive && entry.type === "directory") pending.push(path);
    }
  }
  return { found, truncated: false };
}

/** The tab that shows this file of the project, if open. */
const openTab = (path: string) => useEditorStore().tabs.find((t) => t.id === path);

export const fileTools: Tools = [
  {
    name: "list_files",
    description:
      "Lists the files and folders of the project (the files of the explorer). Left without a path, it starts at the root.",
    inputSchema: schema({
      path: pathProperty("A folder of the project. Defaults to the root."),
      recursive: boolean("Also list what is inside the folders. Defaults to false."),
      limit: integer("At most this many entries, up to 5000. Defaults to 500."),
    }),
    readOnly: true,
    async execute(input) {
      const limit = optionalInteger(input, "limit", 1, 5000) ?? 500;
      const root = optionalPathOf(input);
      return { root, ...(await walk(projectFs(), root, flag(input, "recursive"), limit)) };
    },
  },
  {
    name: "stat_path",
    description:
      "Tells whether a file or folder of the project exists, and what it is and its size.",
    inputSchema: schema({ path: pathProperty() }, ["path"]),
    readOnly: true,
    async execute(input) {
      const fs = projectFs();
      const path = pathOf(input);
      if (!(await exists(fs, path))) return { path, exists: false };
      const { type, size, mtime } = await fs.stat(path);
      return {
        path,
        exists: true,
        type,
        size,
        modified: mtime ? new Date(mtime).toISOString() : null,
      };
    },
  },
  {
    name: "read_file",
    description:
      "Reads a text file of the project as it is saved. If the file is open with edits that are not saved, those are not here: use read_tab for them.",
    inputSchema: schema({ path: pathProperty() }, ["path"]),
    readOnly: true,
    async execute(input) {
      const fs = projectFs();
      const path = pathOf(input);
      const { size } = await fs.stat(path);
      if (size > MAX_FILE_BYTES) throw new Error(`"${path}" is too big to read (${size} bytes).`);
      let body: string;
      try {
        body = await readTextFile(fs, path);
      } catch (error) {
        throw error instanceof TypeError ? new Error(`"${path}" is not a text file.`) : error;
      }
      const tab = openTab(path);
      return {
        path,
        content: body,
        ...(tab && useEditorStore().isDirty(tab) && { openWithUnsavedChanges: true }),
      };
    },
  },
  {
    name: "write_file",
    description:
      "AVOID this tool for HTML pages: it writes the source code of the file directly, bypassing the visual editor, and can corrupt what the visual editor shows. ALWAYS prefer the visual editor's tools (get_element_tree, insert_element, set_text, set_attributes, set_styles, move_element, remove_element, duplicate_element, set_style_rule), which change the page safely. Use this one only for files the visual editor does not handle (not HTML), or when none of its tools can do what is needed. Writes a text file of the project, creating it, and the folders above it, if needed. It replaces what was there, for good. Refuses a file that is open with unsaved changes. To change a file that is open, prefer write_tab or replace_in_tab, which the user can undo.",
    inputSchema: schema({ path: pathProperty(), content: string("What the file holds.") }, [
      "path",
      "content",
    ]),
    consequential: true,
    async execute(input) {
      const fs = projectFs();
      const path = pathOf(input);
      if (!path) throw new Error('"path" must name a file.');
      const body = content(input, "content");
      const editor = useEditorStore();
      const tab = openTab(path);
      if (tab && editor.isDirty(tab)) {
        throw new Error(`"${path}" is open with unsaved changes. Save or close it first.`);
      }
      await writeTextFile(fs, path, body);
      const workspace = useWorkspaceStore();
      workspace.refresh();
      // A file that is open and clean shows what was written, and stays clean.
      if (tab) {
        documentFor(tab).setContent(body, { label: "Agente", merge: false });
        tab.saved = body;
      }
      return { path, bytes: new TextEncoder().encode(body).length };
    },
  },
  {
    name: "create_directory",
    description:
      "Creates a folder in the project, and the ones above it. Does nothing if it exists.",
    inputSchema: schema({ path: pathProperty("The folder to create.") }, ["path"]),
    async execute(input) {
      const path = pathOf(input);
      if (!path) throw new Error('"path" must name a folder.');
      await projectFs().createDirectory(path);
      const workspace = useWorkspaceStore();
      // Opens the folder in the explorer, and the ones above it.
      const names = splitPath(path);
      for (let i = 1; i <= names.length; i++) workspace.expanded.add(names.slice(0, i).join("/"));
      workspace.refresh();
      return { path };
    },
  },
  {
    name: "rename_path",
    description:
      "Renames or moves a file or folder of the project. Fails if the destination exists, and if any file under it is open (close them first).",
    inputSchema: schema(
      { from: pathProperty("What to rename."), to: pathProperty("The new path.") },
      ["from", "to"],
    ),
    consequential: true,
    async execute(input) {
      const fs = projectFs();
      const from = pathOf(input, "from");
      const to = pathOf(input, "to");
      if (!from || !to) throw new Error("Neither path can be the root.");
      const open = useEditorStore().tabs.filter(
        (t) => t.id === from || t.id.startsWith(`${from}/`),
      );
      if (open.length) {
        throw new Error(`Close these first: ${open.map((t) => t.id).join(", ")}.`);
      }
      await fs.rename(from, to);
      useWorkspaceStore().refresh();
      return { from, to };
    },
  },
  {
    name: "copy_file",
    description: "Copies a file of the project to another path. Fails if the destination exists.",
    inputSchema: schema(
      { from: pathProperty("The file to copy."), to: pathProperty("Where the copy goes.") },
      ["from", "to"],
    ),
    async execute(input) {
      const fs = projectFs();
      const from = pathOf(input, "from");
      const to = pathOf(input, "to");
      if (await exists(fs, to)) throw new Error(`"${to}" already exists.`);
      await fs.writeFile(to, await fs.readFile(from));
      useWorkspaceStore().refresh();
      return { from, to };
    },
  },
  {
    name: "delete_path",
    description:
      "Deletes a file, or a folder with everything in it, from the project, without asking: it cannot be undone. Files of it that are open are closed, and their unsaved changes are lost.",
    inputSchema: schema({ path: pathProperty("What to delete.") }, ["path"]),
    consequential: true,
    async execute(input) {
      const fs = projectFs();
      const path = pathOf(input);
      if (!path) throw new Error("The root cannot be deleted.");
      await fs.stat(path); // says "not found" before anything is closed
      await fs.delete(path, { recursive: true });
      const editor = useEditorStore();
      const closed = editor.tabs
        .filter((t) => t.id === path || t.id.startsWith(`${path}/`))
        .map((t) => t.id);
      closed.forEach((id) => editor.close(id));
      const workspace = useWorkspaceStore();
      for (const open of workspace.expanded) {
        if (open === path || open.startsWith(`${path}/`)) workspace.expanded.delete(open);
      }
      workspace.refresh();
      return { path, deleted: true, closedTabs: closed };
    },
  },
  {
    name: "open_file",
    description: "Opens a file of the project in the editor and brings it to the front.",
    inputSchema: schema({ path: pathProperty("The file to open.") }, ["path"]),
    async execute(input) {
      const path = pathOf(input);
      await useWorkspaceStore().openFile(path);
      if (!openTab(path)) throw new Error(`Could not open "${path}".`);
      return { path, opened: true };
    },
  },
  {
    name: "search_files",
    description:
      "Looks for text in the text files of the project, line by line. Returns the lines found, with their paths and numbers.",
    inputSchema: schema(
      {
        query: string("What to look for."),
        path: pathProperty("Only under this folder. Defaults to the whole project."),
        regex: boolean("Take the query as a regular expression. Defaults to false."),
        caseSensitive: boolean("Defaults to false."),
        limit: integer("At most this many lines, up to 500. Defaults to 100."),
      },
      ["query"],
    ),
    readOnly: true,
    async execute(input) {
      const fs = projectFs();
      const query = text(input, "query");
      const limit = optionalInteger(input, "limit", 1, 500) ?? 100;
      const source = flag(input, "regex") ? query : query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp(source, flag(input, "caseSensitive") ? "" : "i");

      const { found } = await walk(fs, optionalPathOf(input), true, 5000);
      const matches: { path: string; line: number; text: string }[] = [];
      for (const entry of found) {
        if (entry.type !== "file") continue;
        let body: string;
        try {
          if ((await fs.stat(entry.path)).size > MAX_FILE_BYTES) continue;
          body = await readTextFile(fs, entry.path);
        } catch {
          continue; // not a text file, or gone meanwhile
        }
        const lines = body.split("\n");
        for (let i = 0; i < lines.length; i++) {
          if (!pattern.test(lines[i]!)) continue;
          matches.push({ path: entry.path, line: i + 1, text: lines[i]!.trim().slice(0, 200) });
          if (matches.length >= limit) return { matches, truncated: true };
        }
      }
      return { matches, truncated: false };
    },
  },
];
