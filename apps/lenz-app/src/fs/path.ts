import { FileSystemError } from "./types";

/** The names in a path. `.` and empty parts are dropped; `..` is refused: it would leave the root. */
export function splitPath(path: string): string[] {
  const segments: string[] = [];
  for (const segment of path.split("/")) {
    if (segment === "" || segment === ".") continue;
    if (segment === "..") throw new FileSystemError("InvalidPath", path, `Invalid path: "${path}"`);
    segments.push(segment);
  }
  return segments;
}

/** `a//b/./c/` → `a/b/c`. The root is `""`. */
export const normalizePath = (path: string) => splitPath(path).join("/");

export const joinPath = (...parts: string[]) => normalizePath(parts.join("/"));

export const basename = (path: string) => splitPath(path).pop() ?? "";

export const dirname = (path: string) => splitPath(path).slice(0, -1).join("/");
