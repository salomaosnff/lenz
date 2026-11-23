import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import type { Plugin } from "vite-plus";

/**
 * Builds every workspace extension into public/extensions/ before the app build,
 * so `vp build` ships the app together with its built-in extensions. Extensions
 * run in dependency order through `vp run`, which also caches unchanged ones.
 */
export function buildExtensions(): Plugin {
  let done = false;
  return {
    name: "lenz:build-extensions",
    apply: "build",
    buildStart() {
      // The build can start once per environment; the extensions only need one pass.
      if (done) return;
      done = true;
      const root = resolve(import.meta.dirname, "../../..");
      const result = spawnSync("vp", ["run", "--filter", "./extensions/*", "build"], {
        cwd: root,
        stdio: "inherit",
      });
      if (result.status !== 0) {
        this.error("Building the extensions failed.");
      }
    },
  };
}
