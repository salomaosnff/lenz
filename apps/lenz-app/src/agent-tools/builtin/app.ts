import { validateWhen, matchesWhen } from "../../context";
import { useEditorStore } from "../../editor/store";
import { extensionRecords } from "../../extensions";
import { useWorkspaceStore } from "../../fs/workspace";
import { allTools } from "../registry";
import { schema, string, text, type Tools } from "./input";

export const appTools: Tools = [
  {
    name: "get_app_state",
    description:
      "A summary of the app: the active file, how many files are open and unsaved, whether the project is open, and how many extensions and tools there are. A good first call.",
    readOnly: true,
    execute() {
      const editor = useEditorStore();
      const workspace = useWorkspaceStore();
      const records = [...extensionRecords.values()];
      return {
        activeTab: editor.activeId,
        openTabs: editor.tabs.length,
        unsavedTabs: editor.tabs.filter(editor.isDirty).length,
        project: workspace.fs
          ? { open: true, name: workspace.fs.name, kind: workspace.fs.kind }
          : { open: false, reason: workspace.error },
        extensions: {
          total: records.length,
          active: records.filter((r) => r.status === "active").length,
          failed: records.filter((r) => r.status === "error").map((r) => r.id),
        },
        tools: allTools().length,
      };
    },
  },
  {
    name: "evaluate_when",
    description:
      'Tells whether a "when" condition (what commands, views and shortcuts use, e.g. editorFocus && !readonly) holds now. Throws if it is not valid.',
    inputSchema: schema({ expression: string("The condition.") }, ["expression"]),
    readOnly: true,
    execute(input) {
      const expression = text(input, "expression");
      validateWhen(expression);
      return { expression, holds: matchesWhen(expression) };
    },
  },
];
