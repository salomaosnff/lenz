import path, { join } from "node:path";
import url from "node:url";

import { defineConfig } from "vite";
import Uno from "unocss/vite";
import vue from "@vitejs/plugin-vue";

import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import VueRouter from "unplugin-vue-router/vite";

import Lenz from "@lenz-design/vite-plugin";

const PROJECT_ROOT = path.dirname(url.fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    VueRouter(),
    vue(),
    Uno({
      configFile: "../ui/uno.config.ts",
    }),
    Lenz({
      lenzExecutable: join(PROJECT_ROOT, "../../dist/plain/bin/lenz"),
    }),
    AutoImport({
      imports: ["vue", "vue-router", "@vueuse/core"],
      dirs: [
        "src/store",
        "src/domain",
        "src/containers",
        "src/directives",
        "../ui/src/composable",
      ],
    }),
    Components({
      dirs: [
        "src/components",
        path.resolve(PROJECT_ROOT, "../ui/src/components"),
        path.resolve("../ui/src/directives"),
      ],
      deep: true,
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/lodash-es")) {
            return `vendor/lodash`;
          }

          if (id.includes("node_modules/@mdi")) {
            return `vendor/icons`;
          }

          if (id.includes("node_modules")) {
            return `vendor`;
          }
        },
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler",
      },
    },
  },
});
