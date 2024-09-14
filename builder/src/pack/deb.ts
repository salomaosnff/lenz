import { mkdir, mkdtemp, rm, writeFile } from "fs/promises";
import { ListrTask } from "listr2";
import { tmpdir } from "os";
import { copyFiles } from "../util";
import { basename, dirname, join, relative } from "path";
import { execaCommand as command } from "execa";
import { setTimeout } from "timers/promises";

export class Launcher {
  data: Record<string, any> = {};

  setType(type: string) {
    this.data["Type"] = type;
    return this;
  }

  setExecutable(executable: string) {
    this.data["Exec"] = executable;
    return this;
  }

  setIcon(icon: string) {
    this.data["Icon"] = icon;
    return this;
  }

  setComment(comment: string) {
    this.data["Comment"] = comment;
    return this;
  }

  setName(name: string) {
    this.data["Name"] = name;
    return this;
  }

  setTerminal(terminal: boolean) {
    this.data["Terminal"] = terminal;
    return this;
  }

  setCategories(categories: string[]) {
    this.data["Categories"] = categories.join(";");
    return this;
  }

  setMimeType(mimeType: string) {
    this.data["MimeType"] = mimeType;
    return this;
  }

  toDesktopFile() {
    return [
      "[Desktop Entry]",
      ...Object.entries(this.data).map(([key, value]) => `${key}=${value}`),
    ].join("\n");
  }
}

export class ControlFile {
  data: Record<string, any> = {};

  setArchitecture(architecture: string) {
    this.data["Architecture"] = architecture;
    return this;
  }

  setDepends(depends: string[]) {
    this.data["Depends"] = depends.join(", ");
    return this;
  }

  setDescription(description: string) {
    this.data["Description"] = description;
    return this;
  }

  setMaintainer(maintainer: string) {
    this.data["Maintainer"] = maintainer;
    return this;
  }

  setPackage(packageName: string) {
    this.data["Package"] = packageName;
    return this;
  }

  setSection(section: string) {
    this.data["Section"] = section;
    return this;
  }

  setVersion(version: string) {
    this.data["Version"] = version;
    return this;
  }

  toControlFile() {
    return [
      ...Object.entries(this.data).map(([key, value]) => `${key}: ${value}`),
      "",
    ].join("\n");
  }
}

export interface PackDebianOptions {
  input: string;
  output: string;
}

export function getPackDebianTasks(options: PackDebianOptions): ListrTask<{
  workdir: string;
  controlFile: ControlFile;
}>[] {
  return [
    {
      title: "Create Debian package structure",
      async task(ctx, task) {
        ctx.workdir = await mkdtemp(join(tmpdir(), "lenz-deb-"));

        task.output = "Create Debian package structure";

        const debian = join(ctx.workdir, "DEBIAN");

        await mkdir(debian, { recursive: true });

        await mkdir(join(ctx.workdir, "usr", "bin"), { recursive: true });
        await mkdir(join(ctx.workdir, "usr", "share", "applications"), {
          recursive: true,
        });
      },
    },
    {
      title: "Create control file",
      async task(ctx, task) {
        const controlFile = join(ctx.workdir, "DEBIAN", "control");

        task.output = `Creating control file ${basename(controlFile)}`;

        const controlBuilder = new ControlFile()
          .setPackage("lenz")
          .setDescription("Um editor de páginas web")
          .setVersion("0.0.1")
          .setMaintainer("Salomão Neto <contato@sallon.dev>")
          .setArchitecture("amd64");
        ctx.controlFile = controlBuilder;

        await writeFile(controlFile, controlBuilder.toControlFile());
      },
    },
    {
      title: "Copy build files to debian package workdir",
      async task(ctx, task) {
        const source = options.input;
        const destination = join(ctx.workdir, "usr", "share", "lenz");
        const iconFile = join(options.input, "resources/icon.png");
        const iconDestination = join(ctx.workdir, "usr", "share", "icons", "lenz.sallon.dev.png");

        task.output = `Copying files from ${source}`;

        for await (const message of copyFiles(source, destination)) {
          task.output = message;
        }

        for await (const message of copyFiles(
          iconFile,
          iconDestination
        )) {
          task.output = message;
        }

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
      title: "Create launchers",
      async task(ctx, task) {
        const launchers = {
          lenz: new Launcher()
            .setName("Lenz Designer")
            .setIcon("lenz.sallon.dev")
            .setComment("Editor de páginas web")
            .setMimeType("text/html")
            .setTerminal(true)
            .setType("Application")
            .setCategories(["Development"])
            .setExecutable("lenz %f"),
        };

        for (const [name, launcher] of Object.entries(launchers)) {
          const desktopFile = join(
            ctx.workdir,
            "usr",
            "share",
            "applications",
            `${name}.desktop`
          );

          task.output = `Creating launcher ${basename(desktopFile)}`;

          await writeFile(desktopFile, launcher.toDesktopFile());
        }
      },
    },
    {
      title: "Create Debian package",
      async task(ctx, task) {
        const packageFile = join(
          options.output,
          `${ctx.controlFile.data.Package}-v${ctx.controlFile.data.Version}-linux-${ctx.controlFile.data.Architecture}.deb`
        );

        await mkdir(dirname(packageFile), { recursive: true });

        task.output = `Creating Debian package ${basename(packageFile)}`;

        const execute = command(
          `dpkg-deb --build ${ctx.workdir} ${packageFile}`
        );

        execute.stdout.pipe(task.stdout());
        execute.stderr.pipe(task.stdout());

        await execute;
      },
    },
    {
      title: "Cleanup workdir",
      async task(ctx, task) {
        task.output = "Remove temporary workdir";

        await rm(ctx.workdir, { recursive: true });
      },
    },
  ];
}
