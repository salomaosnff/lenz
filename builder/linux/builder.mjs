import { cp, mkdir, mkdtemp, rm } from "fs/promises";
import { buildPlain } from "../builder.mjs";
import config from "../config.mjs";
import { buildDebPackage } from "../targets/deb.mjs";
import { execHook } from "../hooks.mjs";
import { join } from "path";
import { tmpdir } from "os";

/**
 * Constrói o pacote para a plataforma linux.
 * @param {[string, string][]} files - Arquivos a serem incluídos no pacote.
 */
export async function build(files) {
  if (!config.platforms.linux) {
    return;
  }

  if (!config.platforms.linux.launchers) {
    throw new Error("Missing launchers configuration in linux platform");
  }

  const { target } = config.platforms.linux;

  console.log(`Building for linux platform...`);

  execHook("pre-build-linux");

  for (const arch of config.platforms.linux.arch) {
    const tmpDir = await mkdtemp(
      join(tmpdir(), `${config.app.name}-build-linux-`)
    );

    await buildPlain({
      files,
      nwArch: arch,
      nwPlatform: "linux",
      outDir: tmpDir,
    });

    if (target.plain) {
      execHook("pre-build-linux-plain");
      const plainDir = join(config.outDir, "linux", "plain");

      console.log(`Copying files to ${plainDir}...`);

      await mkdir(plainDir, { recursive: true });
      await cp(tmpDir, plainDir, { recursive: true });

      execHook("post-build-linux-plain");
    }

    if (target.deb) {
      execHook("pre-build-linux-deb");

      const debDir = join(config.outDir, "linux", "deb");

      await buildDebPackage({
        bin: config.platforms.linux.bin,
        build: target.deb.build,
        control: {
          ...target.deb.control,
          Architecture: arch,
        },
        dest: debDir,
        plainDir: tmpDir,
        launchers: config.platforms.linux.launchers,
      });

      execHook("post-build-linux-deb");
    }

    console.log(`Removendo arquivos temporários...`);
    await rm(tmpDir, { recursive: true });
  }

  execHook("post-build-linux");
}
