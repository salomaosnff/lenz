import { join } from "node:path";
import { copyFiles } from "./sources.mjs";
import { download } from "./downloads.mjs";
import { extract } from "./extractor.mjs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import config from "./config.mjs";

export async function buildPlain({
  nwVersion = config.nw?.version ?? "0.85.0",
  nwFlavor = config.nw?.flavor ?? 'normal',
  nwPlatform = "linux",
  nwArch = "x64",
  outDir = join(config.outDir, "plain"),
  files = [],
}) {
  if (nwArch === "amd64") {
    nwArch = "x64";
  }
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  const MIRROR_URL = `https://dl.nwjs.io/v${nwVersion}/nwjs${
    nwFlavor === "normal" ? "" : `-${nwFlavor}`
  }-v${nwVersion}-${nwPlatform}-${nwArch}.tar.gz`;

  const path = await download(MIRROR_URL);

  await extract(path, outDir);

  await writeFile(
    join(outDir, "package.json"),
    JSON.stringify(config.manifest, null, 2)
  );

  await copyFiles(files, outDir);
}
