import { ref } from "vue";

/** Whether the command palette is open. A command toggles it, so a shortcut can too. */
export const paletteOpen = ref(false);
