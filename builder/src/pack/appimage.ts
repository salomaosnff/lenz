import { ensureDir, remove } from "fs-extra";
import { ListrTask } from "listr2";
import { tmpdir } from "os";
import { basename, dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { execaCommand as command } from "execa";
import { mkdtemp, writeFile } from "fs/promises";

import { copyFiles } from "../util";
import { Launcher } from "./deb";

export interface PackAppImageOptions {
  input: string;
  output: string;
}

export function getPackAppImageTasks(options: PackAppImageOptions): ListrTask<{
  workdir: string;
  package: {
    id: string;
    version: string;
    architecture: string;
  };
}>[] {
  return [
    {
      title: "Criar estrutura de pacote AppImage",
      async task(ctx, task) {
        ctx.package = {
          id: "lenz-designer",
          version: "0.1.0",
          architecture: "x86_64",
        };
        ctx.workdir = await mkdtemp(join(tmpdir(), "lenz-appimage-"));

        await ensureDir(join(ctx.workdir, "usr", "bin"));
        await ensureDir(join(ctx.workdir, "usr", "share", "applications"));
      },
    },
    {
      title: "Criar arquivo AppRun",
      async task(ctx, task) {
        const appRunFile = join(ctx.workdir, "AppRun");

        const appRunContent = [
          "#!/bin/bash",
          'DIR="$(dirname "$(readlink -f "$0")")"',
          'exec "$DIR/usr/bin/lenz" "$@"',
          "",
        ].join("\n");

        await writeFile(appRunFile, appRunContent, {
          mode: 0o755,
        });
      },
    },
    {
      title: "Copiar arquivos para o pacote AppImage",
      async task(ctx, task) {
        const source = options.input;
        const destination = join(ctx.workdir, "usr", "share", "lenz");
        const iconFile = join(options.input, "resources/icon.png");
        const iconDestination = join(ctx.workdir, "icon.png");

        task.output = `Copying files from ${source}`;

        await copyFiles(source, destination);
        await copyFiles(iconFile, iconDestination);

        const binFile = join(ctx.workdir, "usr", "bin", "lenz");

        const binContent = [
          "#!/bin/bash",
          'DIR="$(dirname "$(readlink -f "$0")")"',
          'exec "$DIR/../share/lenz/bin/lenz" "$@"',
          "",
        ].join("\n");

        await writeFile(binFile, binContent, { mode: 0o755 });
      },
    },
    {
      title: "Criar lançadores",
      async task(ctx, task) {
        const launcher = new Launcher()
          .setName("Lenz Designer")
          .setIcon("icon")
          .setComment("Editor de páginas web")
          .setMimeType("text/html")
          .setTerminal(false)
          .setType("Application")
          .setCategories(["Development"])
          .setExecutable("usr/bin/lenz %f");

        const desktopFile = join(ctx.workdir, `lenz.desktop`);

        task.output = `Creating launcher ${basename(desktopFile)}`;

        await writeFile(desktopFile, launcher.toDesktopFile());
      },
    },
    {
      title: "Criar pacote AppImage",
      async task(ctx, task) {
        const appimagetoolExec = resolve(
          dirname(fileURLToPath(import.meta.url)),
          "../../vendor/appimagetool-x86_64.AppImage"
        );

        const output = join(options.output, `lenz-designer.AppImage`);

        await ensureDir(dirname(output));

        const execute = command(`${appimagetoolExec} ${ctx.workdir} ${output}`, {
          cwd: options.output,
          env: {
            ARCH: ctx.package.architecture,
          },
        });

        execute.stdout.pipe(task.stdout());
        execute.stderr.pipe(task.stdout());

        await execute;
      },
    },
    {
      title: "Cleanup workdir",
      async task(ctx, task) {
        task.output = "Remove temporary workdir";

        await remove(ctx.workdir);
      },
    },
  ];
}
