#!/usr/bin/env node
import { basename, dirname, join } from "node:path";
import { rm, mkdir, copyFile, readFile, rename, cp } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import FastGlob from "fast-glob";
import { existsSync } from "node:fs";
import { buildCargoProject } from "./util.mjs";
import { spawn } from "node:child_process";

const ROOT_DIR = dirname(dirname(fileURLToPath(import.meta.url)));
const DIST_DIR = join(ROOT_DIR, "./dist/plain");
const DIST_EXTENSIONS_DIR = join(DIST_DIR, "extensions");
const AGENT_DIR = join(ROOT_DIR, "agent");
const SERVER_DIR = join(AGENT_DIR, "server");
const ESM_DIR = join(SERVER_DIR, "resources/esm");
const DIST_ESM_DIR = join(DIST_DIR, "resources/esm");
const WWW_DIST_DIR = join(DIST_DIR, "resources/www");
const APP_DIR = join(ROOT_DIR, "frontend/packages/app");
const WWW_DIR = join(APP_DIR, "dist");

const EXTENSIONS_DIR = join(ROOT_DIR, "agent/extensions");
const EXTENSIONS_TARGET_DIR = join(EXTENSIONS_DIR, "target/release");
const BIN_DIR = join(DIST_DIR, "bin");

await rm(DIST_DIR, { force: true, recursive: true });
await mkdir(DIST_DIR, { recursive: true });

function getDynamicLibraryFilenames(name) {
  return [`lib${name}.so`, `lib${name}.dylib`, `lib${name}.dll`];
}

export async function copyExtensionBuild(name) {
  const extension_dir = join(EXTENSIONS_DIR, name);
  const public_dir = join(extension_dir, "public");
  const manifest_file = join(public_dir, "manifest.json");

  if (!existsSync(manifest_file)) {
    return;
  }

  const dist_extension_dir = join(DIST_EXTENSIONS_DIR, name);
  const manifest = JSON.parse(await readFile(manifest_file, "utf-8"));
  const toCopy = await FastGlob(join(public_dir, "**/*"), {
    cwd: extension_dir,
  });

  await mkdir(dist_extension_dir, { recursive: true });

  for (const file of toCopy) {
    const target = file.replace(public_dir, "");
    const parent = join(dist_extension_dir, dirname(target));

    await mkdir(parent, { recursive: true });
    await copyFile(file, join(dist_extension_dir, target));
  }

  if (manifest.dynlib) {
    const dynlibFiles = manifest.dynlib
      ? getDynamicLibraryFilenames(basename(manifest.dynlib))
      : [];
    const dist_dynlib_dir = join(dist_extension_dir, dirname(manifest.dynlib));

    await mkdir(dist_dynlib_dir, { recursive: true });

    for (const file of dynlibFiles) {
      const source = join(EXTENSIONS_TARGET_DIR, file);
      const target = join(dist_dynlib_dir, file);

      if (existsSync(source)) {
        await rename(source, target);
      }
    }
  }
}

async function copyAllExtensionsBuild() {
  for (const extension of await FastGlob(join(EXTENSIONS_DIR, "*"), {
    onlyDirectories: true,
  })) {
    if (basename(extension) === "target") {
      continue;
    }
    await copyExtensionBuild(basename(extension));
  }
}

console.log("Building server", SERVER_DIR);

async function copyResources() {
  await mkdir(dirname(DIST_ESM_DIR), { recursive: true });
  await cp(ESM_DIR, DIST_ESM_DIR, {
    recursive: true,
    preserveTimestamps: true,
    force: true,
  });
  await cp(WWW_DIR, WWW_DIST_DIR, {
    recursive: true,
    preserveTimestamps: true,
    force: true,
  });
}

function buildFrontend() {
  return new Promise((resolve, reject) => {
    const process = spawn("pnpm", ["build"], {
      stdio: "inherit",
      cwd: APP_DIR,
    });

    process.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error("Frontend build failed"));
      }
    });

    process.on("error", (err) => {
      reject(err);
    });
  });
}

async function buildServer() {
  await buildCargoProject(SERVER_DIR);
  await mkdir(BIN_DIR, { recursive: true });
  await rename(
    join(AGENT_DIR, "target/release/lenz_server"),
    join(BIN_DIR, "lenz")
  );
  await copyResources();
}

await buildCargoProject(EXTENSIONS_DIR);
await copyAllExtensionsBuild();
await buildFrontend();
await buildServer();
