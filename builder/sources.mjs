import { basename, dirname, join, normalize, relative, resolve } from "path";
import config from "./config.mjs";
import { ROOT_DIR } from "./const.mjs";
import glob from "fast-glob";
import { Presets, SingleBar } from "cli-progress";
import { cp, mkdir, stat } from "fs/promises";

export async function getFiles() {
  const entries = [];

  for (const item of config.sources) {
    for await (const file of filterFiles(item)) {
      entries.push([file, join(item.to, relative(item.from, file))]);
    }
  }

  return entries;
}

async function* filterFiles({ from, filter }) {
  if (from.includes("*") && filter.length) {
    throw new Error("Cannot use filter when from is a glob pattern");
  }

  const fromStat = await stat(resolve(ROOT_DIR, from)).catch(() => {});

  filter = filter.length
    ? filter.map((pattern) => {
        if (pattern.startsWith("!")) {
          return "!" + join(from, pattern.slice(1));
        }

        return join(from, pattern);
      })
    : [fromStat?.isFile() ? from : join(from, "**")];

  for await (const file of glob.stream(filter, {
    cwd: ROOT_DIR,
    markDirectories: true,
    unique: true,
  })) {
    yield normalize(file);
  }
}

export async function copyFiles(entries, dest) {
  const bar = new SingleBar(
    {
      format: "Copying {filename} | {bar} | {percentage}% | ETA: {eta}s",
      hideCursor: true,
    },
    Presets.shades_classic
  );

  bar.start(entries.length, 0);

  for (const [from, to] of entries) {
    const inputFile = resolve(ROOT_DIR, from);
    const outputFile = resolve(dest, to);

    await mkdir(dirname(outputFile), { recursive: true });
    await cp(inputFile, outputFile, { recursive: true, dereference: true });

    bar.increment(1, { filename: basename(inputFile) });
  }

  bar.stop();
}
