import { program } from "commander";
import { join, dirname, relative, resolve } from "path";
import { fileURLToPath } from "node:url";
import { Listr } from "listr2";
import { ensureDir, remove } from "fs-extra";

import { getBuildAgentTasks } from "./build/agent";
import { getBuildExtensionsTask } from "./build/extensions";
import { getBuildFrontendTasks } from "./build/frontend";
import { getPackDebianTasks, Launcher } from "./pack/deb";
import { getPackArquiveTasks } from "./pack/archive";
import { getPackAppImageTasks } from "./pack/appimage";
import { getBuildEsmTasks } from "./build/esm";
import { clearHashs, isChanged } from "./hash";
import { readFile, unlink, writeFile } from "node:fs/promises";
import { execaCommand } from "execa";
import { execSync } from "node:child_process";

import { marked } from "marked";
import { JSDOM } from "jsdom";


const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../');
const ROOT_PROJECT = dirname(ROOT_DIR);

function convertMarkdownToAppstream(markdownText: string) {
  // Converte Markdown para HTML
  const html = marked(markdownText.replaceAll('&nbsp;', ' ')) as string;

  // Usa JSDOM para manipular o HTML
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Remove tags não suportadas
  const allowedTags = ["p", "ul", "ol", "li", "em", "code"];

  document.body.querySelectorAll("a").forEach((node) => {
    // Remove links
    node.remove();
  });

  document.body.querySelectorAll("*").forEach((node) => {
    if (allowedTags.includes(node.tagName.toLowerCase())) {
      if (node.tagName.toLowerCase() === "li") {
        node.textContent = (node.textContent?.[0]?.toUpperCase() ?? '') + node.textContent?.slice(1);
      }
      return;
    }

    if (node.tagName.toLowerCase().startsWith("h")) {
      // Converte cabeçalhos em parágrafos
      const newNode = document.createElement("p");
      newNode.innerHTML = node.innerHTML;
      node.replaceWith(newNode);
      return;
    }

    // Substitui a tag não suportada pelo conteúdo interno
    node.replaceWith(...node.childNodes);

  });

  document.body.querySelectorAll("p").forEach((node) => {
    if (node.textContent?.trim() === "") {
      node.remove();
    }
  });

  // Retorna o HTML processado como string
  return document.body.innerHTML.trim();
}

async function clean(options: any) {
  await remove(join(process.cwd(), options.output));
  await clearHashs()
}

program
  .name("make")
  .description("Uma ferramenta de linha de comando para construir o Lenz Designer")
  .version("0.0.1")
  .option("-i, --input <input>", "Diretório de entrada", relative(process.cwd(), ROOT_PROJECT))
  .option("-o, --output <output>", "Diretório de saída", "dist");


program
  .command("build")
  .description("Compila o Lenz Designer")
  .option("--no-agent", "Não compilar agente")
  .option("--no-esm", "Não compilar módulos ECMAScript")
  .option("--no-extensions", "Não compilar extensões")
  .option("--no-frontend", "Não compilar frontend")
  .option("--no-esm-copy", "Não copiar módulos ECMAScript")
  .option("--no-types", "Não copiar tipos de módulos ECMAScript")
  .option("--no-frontend-copy", "Não copiar arquivos de frontend")
  .option("--clean", "Limpar diretório de saída")
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
    relative(process.cwd(), join(ROOT_PROJECT, "extensions"))
  )
  .action(async function () {
    const options = this.optsWithGlobals();

    if (options.clean) {
      await clean(options);
    }

    await new Listr([
      {
        title: "Agente",
        skip: async () => !options.agent || !await isChanged(resolve(process.cwd(), options.input, "agent/{src,server/resources}/**/*")),
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
        skip: async () => !options.esm || !await isChanged(resolve(process.cwd(), options.input, "packages/esm/src/**/*")),
        async task(_, task) {
          return task.newListr(
            getBuildEsmTasks({
              input: resolve(process.cwd(), options.input, "packages/esm"),
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
        skip: async () => !options.extensions || !await isChanged(resolve(process.cwd(), options.extensionsDir, "**/*")),
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
        skip: async () => !options.frontend || !await isChanged(resolve(process.cwd(), options.input, "packages/app/**/*")),
        task: async (_, task) =>
          task.newListr(
            getBuildFrontendTasks({
              input: resolve(
                process.cwd(),
                options.input,
                "packages/app"
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
      {
        title: "Criar AppStream.xml",
        skip: async () => !options.agent,
        async task() {
          const data = await fetch('https://api.github.com/repos/salomaosnff/lenz/releases').then(res => res.json());
          const currentTag = execSync(`git describe --tags --abbrev=0`, {
            cwd: ROOT_PROJECT,
          }).toString().trim();

          const match = currentTag.match(/^(v.*?)\s*(.*)$/);

          if (match) {
            if (match[1].trim() !== data[0].tag_name) {
              const fromTag = execSync(`git describe --tags --abbrev=0 $(git rev-list --tags --skip=1 --max-count=1)`, {
                cwd: ROOT_PROJECT,
              }).toString().trim();

              const changelogTagRegex = /\{\{\s*CHANGELOG\s*\}\}/gi
              let releaseBody = await readFile(join(ROOT_PROJECT, ".github/RELEASE_BODY.md"), 'utf-8');

              await execaCommand(`pnpm changelogithub --output=.github/RELEASE_CHANGELOG.md --from=${fromTag} --to=${currentTag}`, {
                cwd: ROOT_PROJECT,
              });

              const changelog = await readFile(join(ROOT_PROJECT, ".github/RELEASE_CHANGELOG.md"), 'utf-8');

              await unlink(join(ROOT_PROJECT, ".github/RELEASE_CHANGELOG.md"));

              if (changelogTagRegex.test(releaseBody)) {
                releaseBody = releaseBody.replace(changelogTagRegex, changelog);
              } else {
                releaseBody += `\n\n## Changelog\n\n${changelog}`;
              }

              data.unshift({
                tag_name: currentTag,
                published_at: new Date().toISOString(),
                body: releaseBody,
                html_url: `https://github.com/salomaosnff/lenz/releases/tag/${match[1]}`,
              });

              console.log(data[0])
            }
          }

          if (data[0].tag_name !== currentTag) { }
          const releases = data.map((release: any) => `<release version="${release.tag_name.replace(/^v+/, '')}" date="${release.published_at}">
  <description>
    ${convertMarkdownToAppstream(release.body)}
  </description>
  <url>${release.html_url}</url>
</release>`).join('\n');

          const appStream = `<?xml version="1.0" encoding="UTF-8"?>
<component type="desktop-application">
  <id>dev.sallon.lenz</id>
  <name>Lenz Designer</name>
  <summary>Editor de páginas web</summary>
  <description>
    <p>
      Um editor de páginas Web para todos
    </p>
  </description>
  <launchable type="desktop-id">dev.sallon.lenz.desktop</launchable>

  <developer id="sallon.dev">
    <name>Salomão Neto</name>
    <url>https://sallon.dev</url>
  </developer>
  
  <screenshots>
    <screenshot type="default">
      <image>https://i.imgur.com/eN6BMvV.png</image>
    </screenshot>
    <screenshot>
      <image>https://i.imgur.com/vHOsCLu.png</image>
    </screenshot>
    <screenshot>
      <image>https://i.imgur.com/VvHdzvJ.png</image>
    </screenshot>
  </screenshots>

  <provides>
    <binary type="executable">lenz</binary>
    <mediatype>text/html</mediatype>
  </provides>
  
  <metadata_license>MIT</metadata_license>
  <project_license>MIT</project_license>

  <url type="homepage">https://sallon.dev/lenz</url>
  <url type="bugtracker">https://github.com/salomaosnff/lenz/issues</url>
  <url type="repository">https://github.com/salomaosnff/lenz</url>
  <url type="contribute">https://github.com/salomaosnff/lenz/blob/main/.github/CONTRIBUTING.md</url>
  <url type="contact">https://sallon.dev</url>
  
  <supports>
    <control>pointing</control>
    <control>keyboard</control>
    <control>touch</control>
  </supports>

  <content_rating type="oars-1.1" />
  <releases>${releases}</releases>
</component>`

          const appStreamPath = resolve(
            process.cwd(),
            options.output,
            "plain",
            "metainfo",
            "dev.sallon.lenz.metainfo.xml"
          );

          await ensureDir(dirname(appStreamPath));

          await writeFile(appStreamPath, appStream, 'utf-8');
        }
      },
      {
        title: "Criar lançador",
        skip: async () => !options.agent,
        async task() {
          const launcher = new Launcher()
            .setName("Lenz Designer")
            .setIcon("dev.sallon.lenz")
            .setComment("Editor de páginas web")
            .setMimeType("text/html")
            .setTerminal(false)
            .setType("Application")
            .setCategories(["Development"])
            .setExecutable("lenz %f");

          const iconPath = resolve(
            process.cwd(),
            options.output,
            "plain",
            "launchers",
            "dev.sallon.lenz.desktop"
          )

          await ensureDir(dirname(iconPath));

          await writeFile(iconPath, launcher.toDesktopFile(), 'utf-8')
        }
      }
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
              output: resolve(process.cwd(), options.output, "target"),
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
              output: resolve(process.cwd(), options.output, "target"),
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
              output: resolve(process.cwd(), options.output, "target"),
              noTarGz: options.noTarGz,
              noZip: options.noZip,
              noTarXz: options.noTarXz,
            })
          ),
      },
    ]).run();
  });

program.parse();
