import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import unocss from "unocss/vite";
import externalize from "vite-plugin-externalize-dependencies";

import {Lenz} from './lenz'

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  plugins: [
    react(),
    unocss(),
    Lenz(),
    externalize({
      externals: [/^lenz:/],
    }),
  ],
});
