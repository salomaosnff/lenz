import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import Externalize from 'vite-plugin-externalize-dependencies'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    Externalize({
      externals: [
        /^lenz:/
      ]
    }),
  ],
  build: {
    rollupOptions: {
      external: (id) => id.startsWith("lenz:")
    },
  },
});
