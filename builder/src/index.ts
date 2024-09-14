import { program } from "commander";
import { join, dirname } from "path";
import { getBuildAgentTasks } from "./build/agent";
import { Listr } from "listr2";
import { getBuildExtensionsTask } from "./build/extensions";
import { getBuildFrontendTasks } from "./build/frontend";
import { rm } from "fs/promises";
import { getPackDebianTasks } from "./pack/deb";
import { getPackArquiveTasks } from "./pack/archive";
import { getPackAppImageTasks } from "./pack/appimage";

let outDirDeleted = false;

const ROOT_DIR = dirname(__dirname);

if (process.cwd() === ROOT_DIR) {
  process.chdir(dirname(ROOT_DIR));
}

async function clean(options: any) {
  if (!outDirDeleted) {
    outDirDeleted = true;
    await rm(join(process.cwd(), options.output), {
      force: true,
      recursive: true,
    });
  }
}

program
  .name("lenz-build")
  .description("A simple CLI for building Lenz Designer")
  .version("0.0.1")
  .option("-i, --input <input>", "Diretório de entrada", "../")
  .option("-o, --output <output>", "Diretório de saída", "dist")
  .option(
    "-I, --incremental",
    "Compilação incremental, não limpa o diretório de saída"
  );

program.on("option:incremental", function () {
  outDirDeleted = true;
});

const build = program
  .command("build")
  .description("Build all (agent, extensions and frontend)")
  .option("--no-agent", "Não compilar agente")
  .option("--no-resources", "Não copiar recursos do agente")
  .option("--no-extensions", "Não compilar extensões embutidas no agente")
  .option("--no-frontend", "Não compilar frontend")
  .option("--no-frontend-copy", "Não copiar arquivos do frontend")
  .option(
    "--include-extensions <...include>",
    "Incluir extensões no agente"
  )
  .option(
    "--exclude-extensions <...exclude>",
    "Excluir extensões do agente"
  )
  .option(
    "--extensions-dir <dir>",
    "Diretório das extensões",
    "../agent/extensions"
  )
  .action(async function () {
    const options = this.optsWithGlobals();

    await clean(options);

    await new Listr([
      {
        title: "Build Server Agent",
        skip: () => !options.agent,
        task: async (_, task) =>
          task.newListr(
            await getBuildAgentTasks({
              input: join(process.cwd(), options.input),
              output: join(process.cwd(), options.output, "plain"),
              skipBuild: options.noAgent,
              skipResources: options.noResources,
              skipBin: options.noBin,
            })
          ),
      },
      {
        title: "Build Extensions",
        skip: () => !options.extensions,
        task: async (_, task) =>
          task.newListr(
            await getBuildExtensionsTask({
              input: join(process.cwd(), options.extensionsDir),
              output: join(
                process.cwd(),
                options.output,
                "plain",
                "extensions"
              ),
              include: options.includeExtensions,
              exclude: options.excludeExtensions,
            })
          ),
      },
      {
        title: "Build Frontend",
        skip: () => !options.frontend,
        task: async (_, task) =>
          task.newListr(
            getBuildFrontendTasks({
              input: join(
                process.cwd(),
                options.input,
                "frontend/packages/app"
              ),
              output: join(
                process.cwd(),
                options.output,
                "plain",
                "resources",
                "www"
              ),
              noBuild: options.noFrontend,
              noCopy: options.noFrontendCopy,
            })
          ),
      },
    ]).run();
  });

build
  .command("server")
  .description("Compilar somente o servidor")
  .option("--no-build", "Não compilar")
  .option("--no-bin", "Não copiar binários")
  .option("--no-resources", "Não copiar recursos")
  .action(async function () {
    const options = this.optsWithGlobals();

    await clean(options);

    const tasks = await getBuildAgentTasks({
      input: join(process.cwd(), options.input),
      output: join(process.cwd(), options.output, "plain"),
      skipBuild: !options.build,
      skipResources: !options.resources,
      skipBin: !options.bin,
    });

    await new Listr(tasks).run();
  });

build
  .command("extensions")
  .description("Build extensions")
  .option("-i, --include <...include>", "Include extensions")
  .option("-e, --exclude <...exclude>", "Exclude extensions")
  .option("-d, --dir <dir>", "Extensions directory", "../agent/extensions")
  .action(async function () {
    const options = this.optsWithGlobals();

    await clean(options);

    const tasks = await getBuildExtensionsTask({
      input: join(process.cwd(), options.dir),
      output: join(process.cwd(), options.output, "plain", "extensions"),
      include: options.include,
      exclude: options.exclude,
    });

    await new Listr(tasks).run();
  });

build
  .command("frontend")
  .description("Build frontend")
  .option("--no-build", "Não compilar")
  .option("--no-copy", "Não copiar arquivos")
  .action(async function () {
    const options = this.optsWithGlobals();

    await clean(options);

    const tasks = getBuildFrontendTasks({
      input: join(process.cwd(), options.input, "frontend/packages/app"),
      output: join(process.cwd(), options.output, "plain", "resources", "www"),
      noBuild: !options.build,
      noCopy: !options.copy,
    });

    await new Listr(tasks).run();
  });

const pack = program
  .command("pack")
  .description("Pack application")
  .option("--plain-dir <input>", "Diretório de entrada", "dist/plain")
  .option("--archive-dir <output>", "Diretório de saída", "dist/targets/archive")
  .option("--deb-dir <output>", "Diretório de saída", "dist/targets/deb")
  .option("--appimage-dir <output>", "Diretório de saída", "dist/targets/appimage")
  .option("--no-deb", "Não criar pacote deb")
  .option("--no-appimage", "Não criar AppImage")
  .option("--no-archive", "Não criar arquivo")
  .option("--no-tar-gz", "Não criar arquivo tar.gz")
  .option("--no-tar-xz", "Não criar arquivo tar.xz")
  .option("--no-zip", "Não criar arquivo zip")
  .action(async function () {
    const options = this.optsWithGlobals();

    await new Listr([
      {
        title: "Create Debian package",
        skip: () => !options.deb,
        task: async (_, task) =>
          task.newListr(
            getPackDebianTasks({
              input: join(process.cwd(), options.plainDir),
              output: join(process.cwd(), options.debDir),
            })
          ),
      },
      {
        title: "Create AppImage Exacutable",
        skip: () => !options.appimage,
        task: async (_, task) =>
          task.newListr(
            getPackAppImageTasks({
              input: join(process.cwd(), options.plainDir),
              output: join(process.cwd(), options.appimageDir),
            })
          ),
      },
      {
        title: "Create archive",
        skip: () => !options.archive,
        task: async (_, task) =>
          task.newListr(
            await getPackArquiveTasks({
              input: join(process.cwd(), options.plainDir),
              output: join(process.cwd(), options.archiveDir),
              noTarGz: options.noTarGz,
              noZip: options.noZip,
              noTarXz: options.noTarXz,
            })
          ),
      },
    ]).run();
  });

pack
  .command("deb")
  .action(async function () {
    const options = this.optsWithGlobals();

    const debTasks = getPackDebianTasks({
      input: join(process.cwd(), options.plainDir),
      output: join(process.cwd(), options.debDir),
    });

    await new Listr(debTasks).run();
  });

pack
  .command("appimage")
  .action(async function () {
    const options = this.optsWithGlobals();

    const appImageTasks = getPackAppImageTasks({
      input: join(process.cwd(), options.plainDir),
      output: join(process.cwd(), options.appimageDir),
    });

    await new Listr(appImageTasks).run();
  });

pack
  .command("archive")
  .action(async function () {
    const options = this.optsWithGlobals();

    const archiveTasks = await getPackArquiveTasks({
      input: join(process.cwd(), options.plainDir),
      output: join(process.cwd(), options.archiveDir),
      noTarGz: !options.tarGz,
      noZip: !options.zip,
      noTarXz: !options.tarXz,
    });

    await new Listr(archiveTasks).run();
  });

program.parse();
