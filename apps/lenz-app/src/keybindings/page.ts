import { useEditorStore } from "../editor/store";

export const KEYBINDINGS_PAGE_ID = "keybindings:";

/** Opens (or goes to) the keybindings screen, in a tab of the editor area. */
export function openKeybindingsPage() {
  useEditorStore().open(KEYBINDINGS_PAGE_ID, "", {
    name: "Atalhos de teclado",
    icon: "lucide:keyboard",
    editorId: "lenz.keybindings",
    locked: true,
  });
}
