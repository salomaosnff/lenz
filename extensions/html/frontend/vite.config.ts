import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import Lenz from '@lenz-design/vite-plugin'
import Uno from 'unocss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    Uno(),
    vue(),
    Lenz({
      lenzExecutable: '../../../../dist/plain/bin/lenz'
    }),
  ],
  resolve: {
    alias: {
      '@lenz/json-forms': '../../../packages/json-schema-form/src/'
    }
  },
  build: {
    target: 'es2023',
    rollupOptions: {
      external: (id) => id.startsWith("lenz:") || id === 'vue'
    },
    lib: {
      entry: "src/main.ts",
      name: "Lenz",
      formats: ['es'],
      fileName: (format) => `html.lenz.${format}.js`,
    }
  },
});
