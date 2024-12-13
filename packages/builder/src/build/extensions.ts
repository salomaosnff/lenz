import { ListrTask } from "listr2";
import { execaCommand as command } from "execa";
import { exists } from "fs-extra";
import { readFile, readdir } from "fs/promises";
import { basename, dirname, join } from "node:path";
import { copyFiles } from "../util";
import { isChanged } from "../hash";

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

    if (!(await exists(manifestFile))) {
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
  const include = ([] as string[]).concat(
    options.include ?? (await getAllExtensions(options.input))
  );
  const exclude = ([] as string[]).concat(options.exclude ?? []);

  const extensions = include.filter((ext) => !exclude.includes(ext));

  return [
    {
      title: "Compilar workspace de extensões utilizando cargo",
      skip: async () => !await isChanged(join(options.input, "*/src/**/*")),
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
      title: "Copiar arquivos de extensões",
      task: async (_, task) =>
        task.newListr(
          extensions.map((ext) => ({
            title: `Construir "${ext}"`,
            skip: async () => !await isChanged([
              join(options.input, ext, "public/**/*"),
              join(options.input, ext, "frontend/src/**/*"),
            ]),
            task: (_, task) =>
              task.newListr([
                {
                  title: "Construir frontend usando `pnpm build`...",
                  skip: async () => {
                    const packageJson = join(
                      options.input,
                      ext,
                      "frontend/package.json"
                    );

                    return !(await exists(packageJson));
                  },
                  task: async (_, task) => {
                    task.output = "Instalando dependências...";
                    const install = command("pnpm install", {
                      cwd: join(options.input, ext, "frontend"),
                    });

                    install.stdout.pipe(task.stdout());
                    install.stderr.pipe(task.stdout());

                    await install;

                    task.output = "Executando `pnpm build`...";

                    const execute = command("pnpm build", {
                      cwd: join(options.input, ext, "frontend"),
                    });

                    execute.stdout.pipe(task.stdout());
                    execute.stderr.pipe(task.stdout());

                    await execute;

                    task.output = "Copiando arquivos de frontend...";

                    await copyFiles(
                      join(options.input, ext, "frontend/dist"),
                      join(options.output, ext, "www")
                    );
                  },
                },
                {
                  title: `Copiar arquivos`,
                  skip: async () => !await isChanged([
                    join(options.input, ext, "public/**/*"),
                    join(options.input, "target", "release/*"),
                  ]),
                  task: async (_, task) => {
                    const inputExtensionDir = join(options.input, ext);
                    const outputExtensionDir = join(options.output, ext);
                    const publicDir = join(inputExtensionDir, "public");
                    const manifestFile = join(publicDir, "manifest.json");

                    task.output = "Lendo manifest.json...";

                    const manifest = JSON.parse(
                      await readFile(manifestFile, "utf-8")
                    );

                    await copyFiles(publicDir, outputExtensionDir);

                    if (manifest.dynlib) {
                      task.output = "Copiando arquivos de biblioteca dinâmica...";
                      const libfiles = getLibNames(manifest.dynlib);
                      const targetDir = join(
                        options.input,
                        "target",
                        "release"
                      );

                      for (const libFile of libfiles) {
                        const libName = basename(libFile);
                        const sourceLibFile = join(targetDir, libName);

                        if (!(await exists(sourceLibFile))) {
                          continue;
                        }

                        await copyFiles(sourceLibFile, join(outputExtensionDir, libFile));
                      }
                    }
                  },
                },
              ]),
          }))
        ),
    },
  ];
}
