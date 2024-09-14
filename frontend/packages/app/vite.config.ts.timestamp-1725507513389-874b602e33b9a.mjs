// vite.config.ts
import vue from "file:///home/sallon/Documentos/lenz/frontend/node_modules/.pnpm/@vitejs+plugin-vue@5.1.2_vite@5.4.1_@types+node@22.5.3_sass@1.77.8__vue@3.4.38_typescript@5.5.4_/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import path from "path";
import Uno from "file:///home/sallon/Documentos/lenz/frontend/node_modules/.pnpm/unocss@0.62.2_postcss@8.4.41_rollup@4.20.0_vite@5.4.1_@types+node@22.5.3_sass@1.77.8_/node_modules/unocss/dist/vite.mjs";
import AutoImport from "file:///home/sallon/Documentos/lenz/frontend/node_modules/.pnpm/unplugin-auto-import@0.18.2_@vueuse+core@11.0.1_vue@3.4.38_typescript@5.5.4___rollup@4.20.0/node_modules/unplugin-auto-import/dist/vite.js";
import Components from "file:///home/sallon/Documentos/lenz/frontend/node_modules/.pnpm/unplugin-vue-components@0.27.4_@babel+parser@7.25.3_rollup@4.20.0_vue@3.4.38_typescript@5.5.4_/node_modules/unplugin-vue-components/dist/vite.js";
import VueRouter from "file:///home/sallon/Documentos/lenz/frontend/node_modules/.pnpm/unplugin-vue-router@0.10.7_rollup@4.20.0_vue-router@4.4.3_vue@3.4.38_typescript@5.5.4___vue@3.4.38_typescript@5.5.4_/node_modules/unplugin-vue-router/dist/vite.js";
import url from "url";
import { defineConfig } from "file:///home/sallon/Documentos/lenz/frontend/node_modules/.pnpm/vite@5.4.1_@types+node@22.5.3_sass@1.77.8/node_modules/vite/dist/node/index.js";
import Externalize from "file:///home/sallon/Documentos/lenz/frontend/node_modules/.pnpm/vite-plugin-externalize-dependencies@1.0.1/node_modules/vite-plugin-externalize-dependencies/dist/index.js";
var __vite_injected_original_import_meta_url = "file:///home/sallon/Documentos/lenz/frontend/packages/app/vite.config.ts";
var PROJECT_ROOT = path.dirname(url.fileURLToPath(__vite_injected_original_import_meta_url));
var vite_config_default = defineConfig({
  plugins: [
    VueRouter(),
    vue(),
    Uno({
      configFile: "../ui/uno.config.ts"
    }),
    {
      name: "inject-lenz",
      transformIndexHtml(html) {
        return {
          html,
          tags: [
            {
              tag: "script",
              injectTo: "head-prepend",
              attrs: {
                src: "http://localhost:5369/importmap.js"
              }
            }
          ]
        };
      }
    },
    Externalize({
      externals: [
        /^lenz:/
      ]
    }),
    AutoImport({
      imports: ["vue", "vue-router", "@vueuse/core"],
      dirs: ["src/store", "src/domain", "src/containers", "src/directives", "../ui/src/composable"]
    }),
    Components({
      dirs: ["src/components", path.resolve(PROJECT_ROOT, "../ui/src/components"), path.resolve("../ui/src/directives")],
      deep: true
    })
  ],
  build: {
    rollupOptions: {
      external: (id) => id.startsWith("lenz:"),
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/lodash-es")) {
            return `vendor/lodash`;
          }
          if (id.includes("node_modules/@mdi")) {
            return `vendor/icons`;
          }
          if (id.includes("node_modules")) {
            return `vendor`;
          }
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9zYWxsb24vRG9jdW1lbnRvcy9sZW56L2Zyb250ZW5kL3BhY2thZ2VzL2FwcFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvc2FsbG9uL0RvY3VtZW50b3MvbGVuei9mcm9udGVuZC9wYWNrYWdlcy9hcHAvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvc2FsbG9uL0RvY3VtZW50b3MvbGVuei9mcm9udGVuZC9wYWNrYWdlcy9hcHAvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgdnVlIGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZSdcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgVW5vIGZyb20gJ3Vub2Nzcy92aXRlJ1xuaW1wb3J0IEF1dG9JbXBvcnQgZnJvbSAndW5wbHVnaW4tYXV0by1pbXBvcnQvdml0ZSdcbmltcG9ydCBDb21wb25lbnRzIGZyb20gJ3VucGx1Z2luLXZ1ZS1jb21wb25lbnRzL3ZpdGUnXG5pbXBvcnQgVnVlUm91dGVyIGZyb20gJ3VucGx1Z2luLXZ1ZS1yb3V0ZXIvdml0ZSdcbmltcG9ydCB1cmwgZnJvbSAndXJsJ1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCBFeHRlcm5hbGl6ZSBmcm9tICd2aXRlLXBsdWdpbi1leHRlcm5hbGl6ZS1kZXBlbmRlbmNpZXMnXG5cbmNvbnN0IFBST0pFQ1RfUk9PVCA9IHBhdGguZGlybmFtZSh1cmwuZmlsZVVSTFRvUGF0aChpbXBvcnQubWV0YS51cmwpKVxuXG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgVnVlUm91dGVyKCksXG4gICAgdnVlKCksXG4gICAgVW5vKHtcbiAgICAgIGNvbmZpZ0ZpbGU6ICcuLi91aS91bm8uY29uZmlnLnRzJyxcbiAgICB9KSxcbiAgICB7XG4gICAgICBuYW1lOiAnaW5qZWN0LWxlbnonLFxuICAgICAgdHJhbnNmb3JtSW5kZXhIdG1sKGh0bWwpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBodG1sLFxuICAgICAgICAgIHRhZ3M6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgdGFnOiAnc2NyaXB0JyxcbiAgICAgICAgICAgICAgaW5qZWN0VG86ICdoZWFkLXByZXBlbmQnLFxuICAgICAgICAgICAgICBhdHRyczoge1xuICAgICAgICAgICAgICAgIHNyYzogJ2h0dHA6Ly9sb2NhbGhvc3Q6NTM2OS9pbXBvcnRtYXAuanMnLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfVxuICAgICAgICAgIF1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgRXh0ZXJuYWxpemUoe1xuICAgICAgZXh0ZXJuYWxzOiBbXG4gICAgICAgIC9ebGVuejovXG4gICAgICBdXG4gICAgfSksXG4gICAgQXV0b0ltcG9ydCh7XG4gICAgICBpbXBvcnRzOiBbJ3Z1ZScsICd2dWUtcm91dGVyJywgJ0B2dWV1c2UvY29yZSddLFxuICAgICAgZGlyczogWydzcmMvc3RvcmUnLCAnc3JjL2RvbWFpbicsICdzcmMvY29udGFpbmVycycsICdzcmMvZGlyZWN0aXZlcycsICcuLi91aS9zcmMvY29tcG9zYWJsZSddLFxuICAgIH0pLFxuICAgIENvbXBvbmVudHMoe1xuICAgICAgZGlyczogWydzcmMvY29tcG9uZW50cycsIHBhdGgucmVzb2x2ZShQUk9KRUNUX1JPT1QsICcuLi91aS9zcmMvY29tcG9uZW50cycpLCBwYXRoLnJlc29sdmUoJy4uL3VpL3NyYy9kaXJlY3RpdmVzJyldLFxuICAgICAgZGVlcDogdHJ1ZSxcbiAgICB9KVxuICBdLFxuICBidWlsZDoge1xuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIGV4dGVybmFsOiAoaWQpID0+IGlkLnN0YXJ0c1dpdGgoJ2xlbno6JyksXG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzKGlkKSB7XG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdub2RlX21vZHVsZXMvbG9kYXNoLWVzJykpIHtcbiAgICAgICAgICAgIHJldHVybiBgdmVuZG9yL2xvZGFzaGBcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ25vZGVfbW9kdWxlcy9AbWRpJykpIHtcbiAgICAgICAgICAgIHJldHVybiBgdmVuZG9yL2ljb25zYFxuICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ25vZGVfbW9kdWxlcycpKSB7XG4gICAgICAgICAgICByZXR1cm4gYHZlbmRvcmBcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICB9XG59KVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF3VSxPQUFPLFNBQVM7QUFDeFYsT0FBTyxVQUFVO0FBQ2pCLE9BQU8sU0FBUztBQUNoQixPQUFPLGdCQUFnQjtBQUN2QixPQUFPLGdCQUFnQjtBQUN2QixPQUFPLGVBQWU7QUFDdEIsT0FBTyxTQUFTO0FBQ2hCLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8saUJBQWlCO0FBUm9MLElBQU0sMkNBQTJDO0FBVTdQLElBQU0sZUFBZSxLQUFLLFFBQVEsSUFBSSxjQUFjLHdDQUFlLENBQUM7QUFJcEUsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsVUFBVTtBQUFBLElBQ1YsSUFBSTtBQUFBLElBQ0osSUFBSTtBQUFBLE1BQ0YsWUFBWTtBQUFBLElBQ2QsQ0FBQztBQUFBLElBQ0Q7QUFBQSxNQUNFLE1BQU07QUFBQSxNQUNOLG1CQUFtQixNQUFNO0FBQ3ZCLGVBQU87QUFBQSxVQUNMO0FBQUEsVUFDQSxNQUFNO0FBQUEsWUFDSjtBQUFBLGNBQ0UsS0FBSztBQUFBLGNBQ0wsVUFBVTtBQUFBLGNBQ1YsT0FBTztBQUFBLGdCQUNMLEtBQUs7QUFBQSxjQUNQO0FBQUEsWUFDRjtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUNBLFlBQVk7QUFBQSxNQUNWLFdBQVc7QUFBQSxRQUNUO0FBQUEsTUFDRjtBQUFBLElBQ0YsQ0FBQztBQUFBLElBQ0QsV0FBVztBQUFBLE1BQ1QsU0FBUyxDQUFDLE9BQU8sY0FBYyxjQUFjO0FBQUEsTUFDN0MsTUFBTSxDQUFDLGFBQWEsY0FBYyxrQkFBa0Isa0JBQWtCLHNCQUFzQjtBQUFBLElBQzlGLENBQUM7QUFBQSxJQUNELFdBQVc7QUFBQSxNQUNULE1BQU0sQ0FBQyxrQkFBa0IsS0FBSyxRQUFRLGNBQWMsc0JBQXNCLEdBQUcsS0FBSyxRQUFRLHNCQUFzQixDQUFDO0FBQUEsTUFDakgsTUFBTTtBQUFBLElBQ1IsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLGVBQWU7QUFBQSxNQUNiLFVBQVUsQ0FBQyxPQUFPLEdBQUcsV0FBVyxPQUFPO0FBQUEsTUFDdkMsUUFBUTtBQUFBLFFBQ04sYUFBYSxJQUFJO0FBQ2YsY0FBSSxHQUFHLFNBQVMsd0JBQXdCLEdBQUc7QUFDekMsbUJBQU87QUFBQSxVQUNUO0FBRUEsY0FBSSxHQUFHLFNBQVMsbUJBQW1CLEdBQUc7QUFDcEMsbUJBQU87QUFBQSxVQUNUO0FBRUEsY0FBSSxHQUFHLFNBQVMsY0FBYyxHQUFHO0FBQy9CLG1CQUFPO0FBQUEsVUFDVDtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
