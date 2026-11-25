import { splitPath } from "./path";
import {
  FileSystemError,
  type DirectoryEntry,
  type FileStat,
  type FileSystemProvider,
} from "./types";

type Handle = FileSystemFileHandle | FileSystemDirectoryHandle;

/** The browser reports problems as DOMExceptions; callers get the file system's own errors. */
function translate(error: unknown, path: string): never {
  if (error instanceof FileSystemError) throw error;
  if (error instanceof DOMException) {
    switch (error.name) {
      case "NotFoundError":
        throw new FileSystemError("NotFound", path);
      case "TypeMismatchError":
        throw new FileSystemError("NotADirectory", path);
      case "InvalidModificationError":
        throw new FileSystemError("NotEmpty", path);
      case "NotAllowedError":
      case "SecurityError":
        throw new FileSystemError("Denied", path);
    }
  }
  throw error;
}

/**
 * A file system over the browser's File System Access handles. A folder the user picked and
 * the origin private file system (OPFS) speak the same API, so they share this; they only
 * differ in where the root handle comes from.
 */
export abstract class HandleFileSystem implements FileSystemProvider {
  abstract readonly kind: string;

  constructor(
    protected readonly root: FileSystemDirectoryHandle,
    readonly name: string = root.name,
  ) {}

  /** The directory at these segments, creating the ones that are missing if `create`. */
  private async directory(segments: string[], create = false): Promise<FileSystemDirectoryHandle> {
    let current = this.root;
    for (const segment of segments) {
      try {
        current = await current.getDirectoryHandle(segment, { create });
      } catch (error) {
        translate(error, segments.join("/"));
      }
    }
    return current;
  }

  /** The file or directory at a path; the root is the root directory. */
  private async handle(path: string): Promise<Handle> {
    const segments = splitPath(path);
    const name = segments.pop();
    if (name === undefined) return this.root;
    const parent = await this.directory(segments);
    try {
      return await parent.getFileHandle(name);
    } catch (error) {
      // Not a file: it may be a directory. Anything but a type mismatch is final.
      if (!(error instanceof DOMException && error.name === "TypeMismatchError")) {
        translate(error, path);
      }
    }
    try {
      return await parent.getDirectoryHandle(name);
    } catch (error) {
      return translate(error, path);
    }
  }

  private async fileHandle(path: string): Promise<FileSystemFileHandle> {
    const handle = await this.handle(path);
    if (handle.kind !== "file") throw new FileSystemError("IsADirectory", path);
    return handle;
  }

  private async directoryHandle(path: string): Promise<FileSystemDirectoryHandle> {
    const handle = await this.handle(path);
    if (handle.kind !== "directory") throw new FileSystemError("NotADirectory", path);
    return handle;
  }

  async stat(path: string): Promise<FileStat> {
    const handle = await this.handle(path);
    if (handle.kind === "directory") return { type: "directory", size: 0, mtime: 0 };
    try {
      const file = await handle.getFile();
      return { type: "file", size: file.size, mtime: file.lastModified };
    } catch (error) {
      return translate(error, path);
    }
  }

  async readDirectory(path: string): Promise<DirectoryEntry[]> {
    const directory = await this.directoryHandle(path);
    const entries: DirectoryEntry[] = [];
    try {
      for await (const [name, handle] of directory.entries()) {
        entries.push({ name, type: handle.kind });
      }
    } catch (error) {
      translate(error, path);
    }
    return entries.sort(
      (a, b) =>
        Number(b.type === "directory") - Number(a.type === "directory") ||
        a.name.localeCompare(b.name),
    );
  }

  async readFile(path: string): Promise<Uint8Array> {
    const handle = await this.fileHandle(path);
    try {
      return new Uint8Array(await (await handle.getFile()).arrayBuffer());
    } catch (error) {
      return translate(error, path);
    }
  }

  async writeFile(path: string, data: Uint8Array): Promise<void> {
    const segments = splitPath(path);
    const name = segments.pop();
    if (name === undefined) throw new FileSystemError("IsADirectory", path);
    const parent = await this.directory(segments, true);
    try {
      const file = await parent.getFileHandle(name, { create: true });
      const writable = await file.createWritable();
      try {
        await writable.write(data as BufferSource);
      } finally {
        await writable.close();
      }
    } catch (error) {
      // A directory with this name: getFileHandle refuses it as a type mismatch.
      if (error instanceof DOMException && error.name === "TypeMismatchError") {
        throw new FileSystemError("IsADirectory", path);
      }
      translate(error, path);
    }
  }

  async createDirectory(path: string): Promise<void> {
    await this.directory(splitPath(path), true);
  }

  async delete(path: string, options: { recursive?: boolean } = {}): Promise<void> {
    const segments = splitPath(path);
    const name = segments.pop();
    if (name === undefined) {
      throw new FileSystemError("InvalidPath", path, "The root cannot be deleted.");
    }
    const parent = await this.directory(segments);
    try {
      await parent.removeEntry(name, { recursive: options.recursive ?? false });
    } catch (error) {
      translate(error, path);
    }
  }

  async rename(from: string, to: string, options: { overwrite?: boolean } = {}): Promise<void> {
    const source = splitPath(from);
    const target = splitPath(to);
    if (source.length === 0 || target.length === 0) {
      throw new FileSystemError("InvalidPath", from, "The root cannot be moved.");
    }
    if (source.join("/") === target.join("/")) return;
    if (target.join("/").startsWith(`${source.join("/")}/`)) {
      throw new FileSystemError("InvalidPath", to, "A directory cannot move into itself.");
    }

    const handle = await this.handle(from);
    let taken: Handle | undefined;
    try {
      taken = await this.handle(to);
    } catch (error) {
      if (!(error instanceof FileSystemError && error.code === "NotFound")) throw error;
    }
    if (taken && !options.overwrite) throw new FileSystemError("Exists", to);

    // Not every browser can move handles, so it is a copy, then a delete of the original.
    const targetName = target.pop()!;
    const targetParent = await this.directory(target, true);
    if (taken) await targetParent.removeEntry(targetName, { recursive: true });
    await this.copy(handle, targetParent, targetName);
    await this.delete(from, { recursive: true });
  }

  private async copy(source: Handle, parent: FileSystemDirectoryHandle, name: string) {
    if (source.kind === "file") {
      const file = await parent.getFileHandle(name, { create: true });
      const writable = await file.createWritable();
      try {
        await writable.write(await source.getFile());
      } finally {
        await writable.close();
      }
      return;
    }
    const directory = await parent.getDirectoryHandle(name, { create: true });
    for await (const [childName, child] of source.entries()) {
      await this.copy(child, directory, childName);
    }
  }
}
