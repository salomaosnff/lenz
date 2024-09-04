import vue from '@vitejs/plugin-vue'
import Uno from 'unocss/vite'
import Components from 'unplugin-vue-components/vite'
import VueRouter from 'unplugin-vue-router/vite'
import { defineConfig } from 'vite'


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    VueRouter(),
    vue(),
    Uno(),
    Components({
      deep: true,
      dirs: ['src/components'],
    })
  ],
})
