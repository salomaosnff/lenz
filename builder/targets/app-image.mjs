/**
 * @typedef {Object} AppImageOptions
 * @property {string} dest - Diretório de destino.
 * @property {string} plainDir - Pasta de origem dos arquivos a serem adicionados ao pacote.
 * @property {string} appRun - Script de execução do aplicativo.
 */

import { spawnSync } from "child_process";
import { cp, mkdir, mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { basename, dirname, join } from "path";
import { fileURLToPath } from "url";
import config from "../config.mjs";
import { launcherFile } from "../linux/launcher.mjs";

/**
 * Cria um pacote AppImage
 * @param {AppImageOptions} options - Opções do pacote.
 */
export async function buildAppImage(options) {
  const version = config.app.version ?? '1.0.0';
  const arch = config.app.arch ?? 'x86_64';
  const tmpDir = await mkdtemp(
    join(tmpdir(), `${config.app.id}-build-app-image`)
  );
  const binFolder = join(tmpDir, "usr", "bin");
  const applicationsFolder = join(tmpDir, "usr", "share", "applications");
  const resourcesFolder = join(tmpDir, "usr", "share", config.app.id);
  const iconPath = join(tmpDir, "usr", "share", 'icons', 'hicolor', '256x256', 'apps', `${config.app.id}.png`);

  const appImageFile = join(
    options.dest,
    `${config.app.id}-${version}-${arch}-linux.AppImage`
  );

  console.log("Criando estrutura de pastas...");
  await Promise.all([
    mkdir(options.dest, { recursive: true }),
    mkdir(binFolder, { recursive: true }),
    mkdir(applicationsFolder, { recursive: true }),
    mkdir(resourcesFolder, { recursive: true }),
  ]);

  console.log("Copiando arquivos...");
  await cp(options.plainDir, resourcesFolder, { recursive: true });

  if (config.platforms.linux.launchers.length > 0) {
      console.log("Criando lançadores...");
      if (!config.platforms.linux.target.appImage.icon) {
        throw new Error("Missing icon configuration in AppImage target");
      }
      await cp(join(options.plainDir, config.platforms.linux.target.appImage.icon), iconPath);
      await cp(join(options.plainDir, config.platforms.linux.target.appImage.icon), join(tmpDir, `${config.app.id}.png`));
      await Promise.all(
        config.platforms.linux.launchers.map(async (launcher) => {
          const launcherPath = join(applicationsFolder, `${launcher.name}.desktop`);
          await writeFile(launcherPath, launcherFile(launcher), { mode: 0o755 });
        })
      );
      await cp(join(applicationsFolder, `${config.platforms.linux.launchers[0]?.name}.desktop`), join(tmpDir, `${config.app.id}.desktop`), { recursive: true });
  } else {
    throw new Error("Missing launchers configuration in AppImage target");
  }


  console.log("Criando binários...");
  await Promise.all(
    Object.entries(config.platforms.linux.bin ?? {}).map(async ([name, command]) => {
      await writeFile(
        join(binFolder, name),
        `#!/bin/env sh\ncd $(dirname "$0");\n\n${command}`,
        {
          mode: 0o755,
        }
      );
    })
  );

  console.log("Criando script de execução...");
  await writeFile(
    join(tmpDir, "AppRun"),
    `#!/bin/env sh\n\nBASEDIR=$(dirname "$0")\ncd "$BASEDIR"\n\n${options.appRun}`,
    {
      mode: 0o755,
    }
  );

  console.log("Construindo pacote...");
  const args = [tmpDir, appImageFile];

  spawnSync(
    join(dirname(fileURLToPath(import.meta.url)), "appimagetool-x86-64.AppImage"),
    args,
    { stdio: "inherit", env: {...process.env,  ARCH: 'x86_64' } }
  );

  console.log("Limpando arquivos temporários...");
  await rm(tmpDir, { recursive: true, force: true });

  console.log("Pacote AppImage criado com sucesso!");
}
