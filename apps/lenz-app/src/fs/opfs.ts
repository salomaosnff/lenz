import { HandleFileSystem } from "./handle";

/** The site's own private storage (OPFS): needs no permission, and is not visible as files on disk. */
export class OpfsFileSystem extends HandleFileSystem {
  readonly kind = "opfs";

  static isSupported(): boolean {
    return (
      typeof navigator !== "undefined" && typeof navigator.storage?.getDirectory === "function"
    );
  }

  static async open(name = "Armazenamento do navegador"): Promise<OpfsFileSystem> {
    return new OpfsFileSystem(await navigator.storage.getDirectory(), name);
  }
}
