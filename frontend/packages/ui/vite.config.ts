import { defineConfig } from 'vite'

import vue from '@vitejs/plugin-vue'
import Uno from 'unocss/vite'
import Components from 'unplugin-vue-components/vite'
import VueRouter from 'unplugin-vue-router/vite'
import Externalize from 'vite-plugin-externalize-dependencies'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    VueRouter(),
    vue(),
    Uno(),
    Components({
      deep: true,
      dirs: ['src/components'],
    }),
    Externalize({
      externals: [
        /^lenz:/
      ]
    }),
    {
      name: 'inject-import-map-script',
      transformIndexHtml(html) {
        return {
          html,
          tags: [
            {
              tag: 'script',
              injectTo: 'head-prepend',
              attrs: {
                src: 'http://localhost:5369/importmap.js',
              },
            }
          ]
        }
      }
    },
  ],
  build: {
   rollupOptions: {
    external: source => source.startsWith('lenz:')
   }
  }
})
