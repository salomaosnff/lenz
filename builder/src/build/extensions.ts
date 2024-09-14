import { ListrTask } from "listr2";
import { execaCommand as command } from "execa";
import { existsSync } from "node:fs";
import { copyFile, mkdir, readdir, readFile } from "node:fs/promises";
import { basename, dirname, join, relative, resolve } from "node:path";
import { copyFiles } from "../util";

export interface BuildExtensionsOptions {
  input: string;
  output: string;
  include?: string[];
  exclude?: string[];
}

async function getAllExtensions(dir: string): Promise<string[]> {
  const items: string[] = [];

  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const manifestFile = join(
      entry.parentPath,
      entry.name,
      "public",
      "manifest.json"
    );

    if (!existsSync(manifestFile)) {
      continue;
    }

    items.push(entry.name);
  }

  return items;
}

function getLibNames(libpath: string): string[] {
  const dir = dirname(libpath);
  const name = basename(libpath);

  return [`lib${name}.dylib`, `lib${name}.so`, `lib${name}.dll`].map((lib) =>
    join(dir, lib)
  );
}

export async function getBuildExtensionsTask(
  options: BuildExtensionsOptions
): Promise<ListrTask[]> {
  const include = ([] as string[]).concat(options.include ?? await getAllExtensions(options.input));
  const exclude = ([] as string[]).concat(options.exclude ?? []);

  const extensions = include.filter((ext) => !exclude.includes(ext));  

  return [
    {
      title: "Building extensions workspace",
      task: async (_, task) => {
        const execute = command("cargo build --release", {
          cwd: options.input,
        });

        execute.stdout.pipe(task.stdout());
        execute.stderr.pipe(task.stdout());

        await execute;
      },
    },
    {
      title: "Copying extensions build files",
      task: async (_, task) =>
        task.newListr(
          extensions.map((ext) => ({
            title: `Copying ${ext} files`,
            task: async (_, task) => {
              const inputExtensionDir = join(options.input, ext);
              const outputExtensionDir = join(options.output, ext);
              const publicDir = join(inputExtensionDir, "public");
              const manifestFile = join(publicDir, "manifest.json");

              task.output = "Reading manifest file...";

              const manifest = JSON.parse(
                await readFile(manifestFile, "utf-8")
              );

              await mkdir(outputExtensionDir, { recursive: true });

              for await (const output of copyFiles(
                publicDir,
                outputExtensionDir
              )) {
                task.output = output;
              }

              if (manifest.dynlib) {
                task.output = "Copying dynamic libraries...";
                const libfiles = getLibNames(manifest.dynlib);
                const targetDir = join(options.input, "target", "release");

                for (const libfile of libfiles) {
                  const libname = basename(libfile);
                  const targetFile = join(targetDir, libname);

                  if (existsSync(targetFile)) {
                    const outputLibFile = join(outputExtensionDir, libfile);

                    await mkdir(dirname(outputLibFile), { recursive: true });
                    await copyFile(targetFile, outputLibFile);
                  }
                }
              }
            },
          }))
        ),
    },
  ];
}
