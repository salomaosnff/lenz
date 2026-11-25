import type { PageContribution } from "lenz-sdk";
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

export const PAGE_EDITOR_PREFIX = "page:";

/** Opens (or goes to) a page contributed by an extension; it is a tab that is not a file. */
export function openPageTab(id: string, page: PageContribution) {
  useEditorStore().open(`${PAGE_EDITOR_PREFIX}${id}`, "", {
    name: page.title,
    icon: page.icon ?? "lucide:app-window",
    editorId: `${PAGE_EDITOR_PREFIX}${id}`,
    locked: true,
  });
}
