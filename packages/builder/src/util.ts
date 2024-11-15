import { copy } from "fs-extra";
import { dirname, join, relative } from "path";

export async function copyFiles(source: string, destination: string) {
  await copy(source, destination, {
    preserveTimestamps: true,
    overwrite: true,
    dereference: true,
  });
}
