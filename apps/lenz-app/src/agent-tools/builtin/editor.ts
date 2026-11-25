import { documentFor } from "../../editor/document";
import { historyOf } from "../../editor/history";
import { useEditorStore, type EditorTab } from "../../editor/store";
import { getEditorProvidersFor } from "../../providers";
import {
  boolean,
  content,
  flag,
  integer,
  optionalInteger,
  optionalText,
  schema,
  string,
  tabPath,
  text,
  type Input,
  type Tools,
} from "./input";

/** The label the history gives what an agent did, so the user can tell it from their own edits. */
const LABEL = "Agente";

/** The tab the agent named, or the active one. */
export function tabOf(input: Input): EditorTab {
  const editor = useEditorStore();
  const path = optionalText(input, "path");
  const tab = path ? editor.tabs.find((t) => t.id === path) : editor.activeTab;
  if (!tab) {
    throw new Error(
      path ? `There is no open file "${path}". See list_tabs.` : "There is no active file.",
    );
  }
  return tab;
}

const summary = (tab: EditorTab) => {
  const editor = useEditorStore();
  return {
    path: tab.id,
    name: tab.name,
    active: tab.id === editor.activeId,
    unsaved: editor.isDirty(tab),
    editorId: tab.editorId,
  };
};

export const editorTools: Tools = [
  {
    name: "list_tabs",
    description: "Lists the files open in the editor, and which one is active.",
    readOnly: true,
    execute: () => useEditorStore().tabs.map(summary),
  },
  {
    name: "read_tab",
    description:
      "Reads the content of an open file, including edits that are not saved. To read a file that is not open, use read_file.",
    inputSchema: schema({ path: tabPath }),
    readOnly: true,
    execute(input) {
      const tab = tabOf(input);
      return { ...summary(tab), content: tab.content };
    },
  },
  {
    name: "write_tab",
    description:
      "Replaces the whole content of an open file. The user can undo it (see undo_tab); it is not saved until save_tab. To change a part, replace_in_tab is safer.",
    inputSchema: schema({ path: tabPath, content: string("The new content of the file.") }, [
      "content",
    ]),
    execute(input) {
      const tab = tabOf(input);
      documentFor(tab).setContent(content(input, "content"), { label: LABEL, merge: false });
      return summary(tab);
    },
  },
  {
    name: "replace_in_tab",
    description:
      "Replaces text in an open file. Fails if the text is not found, or is found more than once and replaceAll is not set, so a wrong guess changes nothing. The user can undo it.",
    inputSchema: schema(
      {
        path: tabPath,
        find: string("The exact text to look for."),
        replace: { type: "string", description: "What to put in its place; may be empty." },
        replaceAll: boolean("Replace every occurrence. Defaults to false."),
      },
      ["find", "replace"],
    ),
    execute(input) {
      const tab = tabOf(input);
      const find = text(input, "find");
      const replacement = content(input, "replace");
      const count = tab.content.split(find).length - 1;
      if (!count) throw new Error("That text is not in the file.");
      if (count > 1 && !flag(input, "replaceAll")) {
        throw new Error(
          `That text is in the file ${count} times: be more specific, or set replaceAll.`,
        );
      }
      documentFor(tab).setContent(tab.content.split(find).join(replacement), {
        label: LABEL,
        merge: false,
      });
      return { ...summary(tab), replaced: count };
    },
  },
  {
    name: "create_tab",
    description:
      "Opens a new file in the editor, not saved anywhere yet. To create a file in the project, use write_file, then open_file.",
    inputSchema: schema(
      {
        path: string("The name of the file, e.g. page.html. It must not be open already."),
        content: { type: "string", description: "What it starts with. Defaults to empty." },
      },
      ["path"],
    ),
    execute(input) {
      const editor = useEditorStore();
      const path = text(input, "path");
      if (editor.tabs.some((t) => t.id === path)) throw new Error(`"${path}" is already open.`);
      editor.open(path, typeof input.content === "string" ? input.content : "");
      return summary(tabOf({ path }));
    },
  },
  {
    name: "activate_tab",
    description: "Brings an open file to the front.",
    inputSchema: schema({ path: string("Path of an open file, from list_tabs.") }, ["path"]),
    execute(input) {
      const tab = tabOf(input);
      useEditorStore().activate(tab.id);
      return summary(tab);
    },
  },
  {
    name: "close_tab",
    description:
      "Closes an open file. A file with unsaved changes is only closed with discardChanges, which loses them for good.",
    inputSchema: schema({
      path: tabPath,
      discardChanges: boolean("Close even with unsaved changes. Defaults to false."),
    }),
    consequential: true,
    execute(input) {
      const editor = useEditorStore();
      const tab = tabOf(input);
      const discard = flag(input, "discardChanges");
      if (editor.isDirty(tab) && !discard) {
        throw new Error(`"${tab.id}" has unsaved changes. Save it, or set discardChanges.`);
      }
      editor.close(tab.id);
      return { closed: tab.id };
    },
  },
  {
    name: "save_tab",
    description:
      "Saves an open file: to the project, if it came from there. A file that is not from the project is only marked as saved.",
    inputSchema: schema({ path: tabPath }),
    async execute(input) {
      const tab = tabOf(input);
      await useEditorStore().save(tab.id);
      return summary(tab);
    },
  },
  {
    name: "save_all_tabs",
    description: "Saves every open file that has unsaved changes.",
    async execute() {
      const editor = useEditorStore();
      const unsaved = editor.tabs.filter(editor.isDirty).map((t) => t.id);
      await editor.saveAll();
      return { saved: unsaved };
    },
  },
  {
    name: "list_editors",
    description:
      "Lists the editors an open file can be shown in (for example the text one and the visual ones of the extensions), and the one in use.",
    inputSchema: schema({ path: tabPath }),
    readOnly: true,
    execute(input) {
      const tab = tabOf(input);
      return {
        path: tab.id,
        current: tab.editorId,
        editors: getEditorProvidersFor(tab.name).map(({ id, label }) => ({ id, label })),
      };
    },
  },
  {
    name: "set_tab_editor",
    description: "Chooses which editor shows an open file. See list_editors for the ids.",
    inputSchema: schema({ path: tabPath, editorId: string("An id from list_editors.") }, [
      "editorId",
    ]),
    execute(input) {
      const tab = tabOf(input);
      const editorId = text(input, "editorId");
      if (!getEditorProvidersFor(tab.name).some((p) => p.id === editorId)) {
        throw new Error(`"${editorId}" cannot show "${tab.id}". See list_editors.`);
      }
      useEditorStore().setEditor(tab.id, editorId);
      return summary(tab);
    },
  },
  {
    name: "get_tab_history",
    description:
      "Lists the states in the history of an open file (what was done, and when), oldest first, and the one the file is at.",
    inputSchema: schema({ path: tabPath }),
    readOnly: true,
    execute(input) {
      const tab = tabOf(input);
      const history = historyOf(tab);
      return {
        path: tab.id,
        index: history.index,
        canUndo: history.canUndo,
        canRedo: history.canRedo,
        entries: history.entries.map(({ label, timestamp }, index) => ({
          index,
          label,
          time: new Date(timestamp).toISOString(),
        })),
      };
    },
  },
  {
    name: "undo_tab",
    description: "Undoes the last change of an open file, or several.",
    inputSchema: schema({ path: tabPath, steps: integer("How many. Defaults to 1.") }),
    execute(input) {
      const history = historyOf(tabOf(input));
      const steps = optionalInteger(input, "steps", 1, 1000) ?? 1;
      let done = 0;
      while (done < steps && history.undo()) done++;
      return { undone: done, index: history.index, canUndo: history.canUndo };
    },
  },
  {
    name: "redo_tab",
    description: "Redoes what undo_tab undid, once or several times.",
    inputSchema: schema({ path: tabPath, steps: integer("How many. Defaults to 1.") }),
    execute(input) {
      const history = historyOf(tabOf(input));
      const steps = optionalInteger(input, "steps", 1, 1000) ?? 1;
      let done = 0;
      while (done < steps && history.redo()) done++;
      return { redone: done, index: history.index, canRedo: history.canRedo };
    },
  },
  {
    name: "go_to_history_entry",
    description:
      "Puts an open file back at a state of its history, by the index get_tab_history gives.",
    inputSchema: schema({ path: tabPath, index: integer("Position in the entries, from 0.") }, [
      "index",
    ]),
    execute(input) {
      const history = historyOf(tabOf(input));
      const index = optionalInteger(input, "index", 0, history.entries.length - 1);
      if (index === undefined || !history.goTo(index)) throw new Error("Cannot go to that state.");
      return { index: history.index };
    },
  },
];
