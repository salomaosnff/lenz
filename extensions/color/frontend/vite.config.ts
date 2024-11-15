import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Uno from 'unocss/vite'

import Lenz from '@lenz-design/vite-plugin'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), Uno(), Lenz() as any],
  build: {
    lib: {
      entry: 'src/main.ts',
      name: 'LenzColor',
      formats: ['es'],
      fileName: (format) => `theme.lenz.${format}.js`
    },
    target: 'esnext',
    rollupOptions: {
      external: (id) => id === 'vue' || id.startsWith('lenz:'),
    }
  },
})
