import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite-plus";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import VueRouter from "vue-router/vite";
import Components from "unplugin-vue-components/vite";
import UnoCSS from "unocss/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { lazyPlugins } from "vite-plus";
import { hostVueBridge } from "./vite/host-vue-bridge";
import { buildExtensions } from "./vite/build-extensions";

// https://vite.dev/config/
export default defineConfig({
  fmt: {
    semi: false,
    singleQuote: true,
  },
  plugins: lazyPlugins(() => [
    hostVueBridge(),
    buildExtensions(),
    VueRouter({ dts: "./src/typed-router.d.ts" }),
    vue(),
    vueDevTools(),
    Components({
      dts: "./src/components.d.ts",
    }),
    UnoCSS(),
    cloudflare(),
  ]),
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
