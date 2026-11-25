export type FileType = "file" | "directory";

export interface DirectoryEntry {
  name: string;
  type: FileType;
}

export interface FileStat {
  type: FileType;
  /** In bytes; 0 for directories. */
  size: number;
  /** Last modification, in ms since the epoch; 0 for directories. */
  mtime: number;
}

export type FileSystemErrorCode =
  | "NotFound"
  | "Exists"
  | "NotADirectory"
  | "IsADirectory"
  | "NotEmpty"
  | "InvalidPath"
  | "Denied"
  | "Unsupported";

export class FileSystemError extends Error {
  constructor(
    readonly code: FileSystemErrorCode,
    readonly path: string,
    message = `${code}: "${path}"`,
  ) {
    super(message);
    this.name = "FileSystemError";
  }
}

/**
 * Where files live. Paths are POSIX style and relative to the root of the file system:
 * `""`, `"/"` and `"."` are the root, and `..` is never allowed to leave it.
 * Implementations throw {@link FileSystemError}.
 */
export interface FileSystemProvider {
  /** What kind of storage this is, e.g. `directory` or `opfs`. */
  readonly kind: string;
  /** What to call the root: the folder's name, for a folder. */
  readonly name: string;

  stat(path: string): Promise<FileStat>;
  /** Directories first, then by name. */
  readDirectory(path: string): Promise<DirectoryEntry[]>;
  readFile(path: string): Promise<Uint8Array>;
  /** Creates the file, and the directories above it, if they do not exist. */
  writeFile(path: string, data: Uint8Array): Promise<void>;
  /** Like `mkdir -p`: also creates the parents, and does nothing if it is already there. */
  createDirectory(path: string): Promise<void>;
  /** A directory with something in it needs `recursive`. */
  delete(path: string, options?: { recursive?: boolean }): Promise<void>;
  /** Moves a file or a directory. Fails if `to` exists, unless `overwrite`. */
  rename(from: string, to: string, options?: { overwrite?: boolean }): Promise<void>;
}

const encoder = new TextEncoder();

export async function readTextFile(fs: FileSystemProvider, path: string): Promise<string> {
  // `fatal`: a binary file is an error, not a string full of replacement characters.
  return new TextDecoder("utf-8", { fatal: true }).decode(await fs.readFile(path));
}

export const writeTextFile = (fs: FileSystemProvider, path: string, text: string) =>
  fs.writeFile(path, encoder.encode(text));

export async function exists(fs: FileSystemProvider, path: string): Promise<boolean> {
  try {
    await fs.stat(path);
    return true;
  } catch (error) {
    if (error instanceof FileSystemError && error.code === "NotFound") return false;
    throw error;
  }
}
