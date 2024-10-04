import { readFile, writeFile } from "node:fs/promises";

const file = "esm-types/index.d.ts";

const content = await readFile(file, "utf-8");

const modules = new Set<string>(
  Array.from(content.matchAll(/declare\s+module\s+(['"])(.+?)\1/g)).map(
    ([, , module]) => module
  )
);

await writeFile(
  file,
  content
    .replace(
      new RegExp(`declare\\s+module\\s+(['"])(.+?)\\1`, "g"),
      "declare module $1lenz:$2$1"
    )
    .replace(/(import.+?)(['"])(.+?)\2/g, "$1$2lenz:$3$2")
    .replace(/declare module (['"])lenz:icons\/(.+?)\1[\s\S]+?}/gm, "declare module $1lenz:icons/$2$1 { export=icon }") + '\n declare const icon: string;'
);
