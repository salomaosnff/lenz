import { program } from "commander";
import { join, dirname, relative, resolve } from "path";
import { fileURLToPath } from "node:url";
import { Listr } from "listr2";
import { remove } from "fs-extra";

import { getBuildAgentTasks } from "./build/agent";
import { getBuildExtensionsTask } from "./build/extensions";
import { getBuildFrontendTasks } from "./build/frontend";
import { getPackDebianTasks } from "./pack/deb";
import { getPackArquiveTasks } from "./pack/archive";
import { getPackAppImageTasks } from "./pack/appimage";
import { getBuildEsmTasks } from "./build/esm";

let outDirDeleted = false;

const ROOT_DIR = dirname(dirname(fileURLToPath(import.meta.url)));
const ROOT_PROJECT = dirname(ROOT_DIR);

async function clean(options: any) {
  if (!outDirDeleted) {
    outDirDeleted = true;
    await remove(join(process.cwd(), options.output));
  }
}

program
  .name("make")
  .description("Uma ferramenta de linha de comando para construir o Lenz Designer")
  .version("0.0.1")
  .option("-i, --input <input>", "Diretório de entrada", relative(process.cwd(), ROOT_PROJECT))
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
  .description("Compila o Lenz Designer")
  .option("--no-agent", "Não compilar agente")
  .option("--no-esm", "Não compilar módulos ECMAScript")
  .option("--no-extensions", "Não compilar extensões")
  .option("--no-frontend", "Não compilar frontend")
  .option("--no-esm-copy", "Não copiar módulos ECMAScript")
  .option("--no-types", "Não copiar tipos de módulos ECMAScript")
  .option("--no-frontend-copy", "Não copiar arquivos de frontend")
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
    relative(process.cwd(), join(ROOT_PROJECT, "agent", "extensions"))
  )
  .action(async function () {
    const options = this.optsWithGlobals();

    await clean(options);

    await new Listr([
      {
        title: "Agente",
        skip: () => !options.agent,
        task: async (_, task) =>
          task.newListr(
            await getBuildAgentTasks({
              input: resolve(process.cwd(), options.input),
              output: resolve(process.cwd(), options.output, "plain"),
              skipBuild: options.noAgent,
              skipResources: options.noResources,
              skipBin: options.noBin,
            })
          ),
      },
      {
        title: "Módulos ECMAScript",
        skip: () => !options.esm,
        async task(_, task) {
          return task.newListr(
            getBuildEsmTasks({
              input: resolve(process.cwd(), options.input, "esm"),
              output: resolve(
                process.cwd(),
                options.output,
                "plain",
                "resources"
              ),
              esm: options.esm,
              esmCopy: options.esmCopy,
              copyTypes: options.types,
            })
          );
        }
      },
      {
        title: "Extensões Embutidas",
        skip: () => !options.extensions,
        task: async (_, task) =>
          task.newListr(
            await getBuildExtensionsTask({
              input: resolve(process.cwd(), options.extensionsDir),
              output: resolve(
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
        title: "Frontend",
        skip: () => !options.frontend,
        task: async (_, task) =>
          task.newListr(
            getBuildFrontendTasks({
              input: resolve(
                process.cwd(),
                options.input,
                "frontend/packages/app"
              ),
              output: resolve(
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

const pack = program
  .command("pack")
  .description("Empacota o Lenz Designer em diferentes formatos")
  .option("--version <version>", "Versão do pacote")
  .option("--all", "Empacotar em todos os formatos")
  .option("--deb", "Criar pacote deb", false)
  .option("--appimage", "Criar AppImage", false)
  .option("--archive", "Criar arquivo", false)
  .option("--no-tar-gz", "Não criar arquivo tar.gz")
  .option("--no-tar-xz", "Não criar arquivo tar.xz")
  .option("--no-zip", "Não criar arquivo zip")
  .action(async function () {
    const options = this.optsWithGlobals();

    const plainDir = resolve(process.cwd(), options.output, "plain");

    await new Listr([
      {
        title: "Create Debian package",
        skip: () => !(options.all || options.deb),
        task: async (_, task) =>
          task.newListr(
            getPackDebianTasks({
              input: plainDir,
              output: resolve(process.cwd(), options.output, "deb"),
            })
          ),
      },
      {
        title: "Create AppImage Exacutable",
        skip: () => !(options.all || options.appimage),
        task: async (_, task) =>
          task.newListr(
            getPackAppImageTasks({
              input: plainDir,
              output: resolve(process.cwd(), options.output, "appimage"),
            })
          ),
      },
      {
        title: "Create archive",
        skip: () => !(options.all || options.archive),
        task: async (_, task) =>
          task.newListr(
            await getPackArquiveTasks({
              input: plainDir,
              output: resolve(process.cwd(), options.output, "archive"),
              noTarGz: options.noTarGz,
              noZip: options.noZip,
              noTarXz: options.noTarXz,
            })
          ),
      },
    ]).run();
  });

program.parse();
