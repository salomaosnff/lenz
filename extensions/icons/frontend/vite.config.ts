import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import Lenz from "@lenz-design/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    Lenz({
      lenzExecutable: "../../../dist/plain/bin/lenz",
    }),
  ],
  build: {
    target: "es2023",
    rollupOptions: {
      external: (id) => id.startsWith("lenz:") || id === "vue",
    },
    lib: {
      entry: "src/main.ts",
      name: "Lenz",
      formats: ["es"],
      fileName: (format) => `icons.lenz.${format}.js`,
      cssFileName: "style",
    },
  },
});
