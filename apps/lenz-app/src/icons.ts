import { ref } from "vue";
import { addCollection } from "@iconify/vue/dist/offline";

/** Flips to true once the icon sets are registered; `<Icon />` re-renders on it. */
export const iconsReady = ref(false);

/**
 * Registers the full icon sets so any `<Icon name="lucide:..." />` resolves
 * offline, including the ones used by extensions. The set is large, so it is
 * loaded as a separate chunk and does not block mounting; icons appear once it lands.
 */
export async function registerIcons() {
  const { default: lucide } = await import("@iconify-json/lucide/icons.json");
  addCollection(lucide);
  iconsReady.value = true;
}
