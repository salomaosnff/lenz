import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: ["src/index.ts", "src/cli.ts"],
    format: ["esm"],
    platform: "node",
    dts: true,
  },
});
