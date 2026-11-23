import { useEditorStore } from "../editor/store";
import { extensionRecords, titleOf } from "./registry";

export const EXTENSION_PAGE_PREFIX = "extension:";

/** Opens (or goes to) the page of an extension, in a tab of the editor area. */
export function openExtensionPage(id: string) {
  const record = extensionRecords.get(id);
  useEditorStore().open(`${EXTENSION_PAGE_PREFIX}${id}`, "", {
    name: record ? titleOf(record) : id,
    icon: "lucide:blocks",
    editorId: "lenz.extension",
    locked: true,
  });
}
