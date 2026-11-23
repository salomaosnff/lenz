import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Plugin } from "vite-plus";
import { parseManifest } from "./manifest.ts";

/**
 * Vite plugin for an extension: writes the `package.json` of the build folder, next to the built
 * file. It is made from the extension's own `package.json` (name, version, `displayName`,
 * `extensionDependencies`, `contributes`), with `main` pointing at the file that was built, and it
 * is checked the way the app will check it, so a broken manifest fails the build.
 */
export function lenzExtension(): Plugin {
  let root = process.cwd();
  return {
    name: "lenz-extension-manifest",
    configResolved(config) {
      root = config.root;
    },
    generateBundle(_, bundle) {
      const source = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as Record<
        string,
        unknown
      >;
      const entry = Object.values(bundle).find((chunk) => chunk.type === "chunk" && chunk.isEntry);
      if (!entry) return this.error('The extension has no entry file to point "main" at.');
      const manifest = parseManifest({
        name: source.name,
        displayName: source.displayName,
        version: source.version,
        description: source.description,
        main: entry.fileName,
        extensionDependencies: source.extensionDependencies,
        contributes: source.contributes,
      });
      // The README is what the extension's page in the app shows.
      const readme = join(root, "README.md");
      if (existsSync(readme))
        this.emitFile({ type: "asset", fileName: "README.md", source: readFileSync(readme) });
      this.emitFile({
        type: "asset",
        fileName: "package.json",
        source: `${JSON.stringify(manifest, null, 2)}\n`,
      });
    },
  };
}
