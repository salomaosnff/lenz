import Vue from '@vitejs/plugin-vue'
import VueJSX from '@vitejs/plugin-vue-jsx'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vite'
import { builtinModules } from 'node:module'

export default defineConfig({
  base: '',
  plugins: [
    Vue(),
    VueJSX(),
    UnoCSS(),
  ],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  build: {
    rollupOptions: {
      external: builtinModules.concat('lenz')
    }
  }
});