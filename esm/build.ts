import { build } from "esbuild";
import glob from "fast-glob";

await build({
  entryPoints: glob.sync("src/**/*.ts", { ignore: ["**/types.ts", "**/*.d.ts"] }),
  tsconfig: "tsconfig.json",
  bundle: false,
  target: "esnext",
  treeShaking: true,
  outdir: "dist",
  format: "esm",
  minify: true,
  platform: "browser",
});
