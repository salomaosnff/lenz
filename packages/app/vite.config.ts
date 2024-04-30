import { defineConfig } from "vite";
import Uno from 'unocss/vite'
import {viteStaticCopy as Copy} from 'vite-plugin-static-copy'
import Vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [
    Vue(),
    Uno(),
    Copy({
      structured: true,
      targets: [
        {
          src: [
            '../api/dist',
            '../api/package.json'
          ],
          dest: 'lenz',
          dereference: true,
          overwrite: true
        }
      ]
    })
  ],

  resolve: {
    alias: {
      '@': '/src'
    }
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
  build: {
    rollupOptions: {
      treeshake: false,
      input: {
        index: './index.html',
        splash: './splash.html',
      },
    }
  }
}));
