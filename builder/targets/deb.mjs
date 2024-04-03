/**
 * @typedef {Object} DebOptions
 * @property {string} Package - Nome do pacote.
 * @property {string} Version - Versão do pacote.
 * @property {string} Architecture - Arquitetura do pacote.
 * @property {string} Maintainer - Mantenedor do pacote.
 * @property {string} Description - Descrição do pacote.
 */

/**
 * @typedef {Object} DebBuildOptions
 * @property {number} compressionLevel - Nível de compressão do pacote.
 * @property {'gzip' | 'xz' | 'zstd' | 'none'} compressionType - Tipo de compressão do pacote.
 * @property {'none' | 'extreme' | 'filtered' | 'huffman' | 'rle' | 'fixed'} strategy - Estratégia de compressão do pacote.
 */

/**
 * @typedef {Object} DebPackageOptions
 * @property {string} dest - Diretório de destino.
 * @property {string} plainDir - Pasta de origem dos arquivos a serem adicionados ao pacote.
 * @property {DebOptions} control - Opções do pacote.
 * @property {Array<import('../linux/launcher.mjs').LauncherOptions>} launchers - Lançadores do pacote.
 * @property {Record<string, string>} bin - Binários do pacote no formato { nome: comando }.
 * @property {DebBuildOptions} build - Opções de construção do pacote.
 */

import { cp, mkdir, mkdtemp, rm, writeFile } from "fs/promises";
import { join, relative } from "path";
import { launcherFile } from "../linux/launcher.mjs";
import { spawnSync } from "child_process";
import { tmpdir } from "os";
import config from "../config.mjs";

/**
 * Cria um arquivo control para o pacote.
 * @param {DebOptions} options
 * @returns {string} Conteúdo do arquivo .control.
 */
export function controlFile(options) {
  const entries = Object.entries(options).reduce((content, [key, value]) => {
    if ((value ?? null) !== null) {
      content += `${key}: ${value}\n`;
    }

    return content;
  }, "");

  return entries;
}

/**
 * Cria a estrutura de pastas e arquivos para um pacote deb.
 * @param {DebPackageOptions} options - Opções do pacote.
 */
export async function buildDebPackage(options) {
  const packageName = options.control.Package ?? config.app.id;
  const version = options.control.Version ?? config.app.version;
  const arch = options.control.Architecture ?? "amd64";
  console.log(`Criando pacote debian "${packageName}"...`);

  const tmpDir = await mkdtemp(join(tmpdir(), `${packageName}-build-deb`));

  const binFolder = join(tmpDir, "usr", "bin");
  const applicationsFolder = join(tmpDir, "usr", "share", "applications");
  const resourcesFolder = join(tmpDir, "usr", "share", packageName);
  const iconsFolder = join(tmpDir, "usr", "share", "icons", "hicolor", "256x256", "apps");

  const debFile = join(options.dest, `${packageName}-${version}-${arch}-linux.deb`);

  console.log("Criando estrutura de pastas...");
  await Promise.all([
    mkdir(join(tmpDir, "DEBIAN"), { recursive: true }),
    mkdir(binFolder, { recursive: true }),
    mkdir(applicationsFolder, { recursive: true }),
    mkdir(resourcesFolder, {
      recursive: true,
    }),
    mkdir(iconsFolder, { recursive: true }),
  ]);

  const control = controlFile({
    Package: packageName,
    Version: version,
    Description: options.control.Description ?? config.app.description,
    Maintainer: options.control.Maintainer ?? config.app.author,
    Architecture: arch,
    ...options.control,
  });

  await writeFile(join(tmpDir, "DEBIAN", "control"), control);

  console.log("Copiando arquivos...");
  await cp(options.plainDir, resourcesFolder, { recursive: true });

  await cp(join(options.plainDir, 'icon.png'), join(iconsFolder, `${config.app.id}.png`));

  console.log("Criando links binários...");
  for (const [name, command] of Object.entries(options.bin)) {
    await writeFile(join(binFolder, name), `#!/bin/env sh\n${command}`, {
      encoding: "utf8",
      mode: 0o755,
    });
  }

  console.log("Criando lançadores...");
  for (const launcher of options.launchers) {
    await writeFile(
      join(applicationsFolder, `${launcher.Name}.desktop`),
      launcherFile(launcher),
      { encoding: "utf8" }
    );
  }

  console.log("Construindo pacote...");
  const args = ["--build"];

  if (typeof options.build?.compressionLevel === "number") {
    args.push(`-z${options.build.compressionLevel}`);
  }

  if (typeof options.build?.compressionType === "string") {
    args.push(`-Z${options.build.compressionType}`);
  }

  if (typeof options.build?.strategy === "string") {
    args.push(`-S${options.build.strategy}`);
  }

  args.push(tmpDir, debFile);

  await mkdir(options.dest, { recursive: true });
  spawnSync("dpkg-deb", args, { stdio: "inherit" });

  await rm(tmpDir, { recursive: true, force: true });

  console.log(`Pacote salvo em ${relative(process.cwd(), debFile)}`);
}
