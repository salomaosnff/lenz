import { defineConfig } from "vite-plus";
import vue from "@vitejs/plugin-vue";
import { lenzExtension } from "lenz-sdk/vite";

/**
 * Builds the extension as a single ES module. `vue` stays an external import:
 * the host resolves it (import map) to its own copy, so the extension's
 * components share the host's reactivity system instead of bundling another Vue.
 */
export default defineConfig({
  plugins: [vue(), lenzExtension()],
  build: {
    // The host serves extensions from its public folder.
    outDir: "../../apps/lenz-app/public/extensions/history-player",
    emptyOutDir: true,
    lib: { entry: "src/index.ts", formats: ["es"], fileName: "index" },
    rollupOptions: { external: ["vue"] },
  },
});
