import { createReadStream } from "node:fs";
import { mkdir, rm, stat } from "node:fs/promises";
import { spawn } from 'node:child_process'
import { SingleBar, Presets } from "cli-progress";
import { basename } from "node:path";

export async function extract(filename, dest) {
  const fileStats = await stat(filename);

  await rm(dest, { recursive: true });
  await mkdir(dest, { recursive: true });

  return new Promise(async (resolve, reject) => {
    const file = createReadStream(filename);
    const bar = new SingleBar(
      {
        format: `Extracting ${basename(filename)} | {bar} | {percentage}% | ETA: {eta}s | {value}/{total} bytes`,
        hideCursor: true,
      },
      Presets.shades_classic
    );

    bar.start(fileStats.size, 0);

    file.on("data", (chunk) => bar.increment(chunk.length));

    const cat = spawn("tar", ["-xzf", '-', "-C", dest, '--strip-components=1'], {
        stdio: ["pipe", "inherit", "inherit"],
    });

    file.pipe(cat.stdin);

    cat.on("exit", (code) => {
        bar.stop();
        if (code === 0) {
            resolve();
        } else {
            reject(new Error(`Failed to extract ${filename}`));
        }
    });
  });
}
