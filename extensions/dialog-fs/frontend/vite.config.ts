import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import unocss from "unocss/vite";

import { Lenz } from "./lenz";

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  plugins: [react(), unocss(), Lenz()],
  define: {
    "process.env": {},
  },
  build: {
    lib: {
      entry: "src/main.tsx",
      name: "LenzFileDialog",
      formats: ["es"],
      fileName: (format) => `file-dialog.lenz.${format}.js`,
      cssFileName: "style",
    },
    target: "esnext",
  },
});
