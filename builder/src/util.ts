import { copyFile, lstat, mkdir, readdir } from "fs/promises";
import { dirname, join, relative } from "path";
import { setTimeout } from "timers/promises";

export async function* copyFiles(
  source: string,
  destination: string
): AsyncGenerator<string> {
  const sourceStat = await lstat(source);
  const destinationStat = await lstat(destination).catch(() => null);

  if (sourceStat.isDirectory() && destinationStat?.isFile()) {
    throw new Error(
      `Cannot copy directory ${relative(
        process.cwd(),
        source
      )} to file ${relative(process.cwd(), destination)}`
    );
  }

  if (sourceStat.isFile()) {
    yield `Copying file ${relative(process.cwd(), destination)}`;

    await mkdir(dirname(destination), { recursive: true });
    await copyFile(source, destination);

    return;
  }

  const entries = await readdir(source, { withFileTypes: true });

  while (entries.length) {
    const entry = entries.pop();

    if (!entry) {
      continue;
    }

    if (entry.isDirectory()) {
      const sourceDir = join(entry.parentPath, entry.name);
      const relative_dir = relative(source, sourceDir);
      const target = join(destination, relative_dir);

      yield `Creating directory ${relative(destination, target)}`;

      entries.push(...(await readdir(sourceDir, { withFileTypes: true })));

      await mkdir(target, { recursive: true });

      continue;
    }

    const sourceFile = join(entry.parentPath, entry.name);
    const relative_file = relative(source, sourceFile);
    const target = join(destination, relative_file);

    yield `Copying file ${relative(destination, target)}`;

    await copyFile(sourceFile, target);
  }
}
