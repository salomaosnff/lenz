/** An in-memory stand-in for the browser's File System Access handles, for tests. */
export type Node =
  | { kind: "file"; data: Uint8Array }
  | { kind: "directory"; children: Map<string, Node> };

const fail = (name: string) => new DOMException(name, name);

/** Just enough of the File System Access API, over a tree in memory. */
export function directoryHandle(
  name: string,
  node: Node & { kind: "directory" },
): FileSystemDirectoryHandle {
  const handle = {
    kind: "directory",
    name,
    async getDirectoryHandle(child: string, options?: { create?: boolean }) {
      let found = node.children.get(child);
      if (!found && options?.create) {
        found = { kind: "directory", children: new Map() };
        node.children.set(child, found);
      }
      if (!found) throw fail("NotFoundError");
      if (found.kind !== "directory") throw fail("TypeMismatchError");
      return directoryHandle(child, found);
    },
    async getFileHandle(child: string, options?: { create?: boolean }) {
      let found = node.children.get(child);
      if (!found && options?.create) {
        found = { kind: "file", data: new Uint8Array() };
        node.children.set(child, found);
      }
      if (!found) throw fail("NotFoundError");
      if (found.kind !== "file") throw fail("TypeMismatchError");
      return fileHandle(child, found);
    },
    async removeEntry(child: string, options?: { recursive?: boolean }) {
      const found = node.children.get(child);
      if (!found) throw fail("NotFoundError");
      if (found.kind === "directory" && found.children.size && !options?.recursive) {
        throw fail("InvalidModificationError");
      }
      node.children.delete(child);
    },
    async *entries() {
      for (const [child, found] of node.children) {
        yield [
          child,
          found.kind === "file" ? fileHandle(child, found) : directoryHandle(child, found),
        ];
      }
    },
  };
  return handle as unknown as FileSystemDirectoryHandle;
}

function fileHandle(name: string, node: Node & { kind: "file" }): FileSystemFileHandle {
  const handle = {
    kind: "file",
    name,
    async getFile() {
      const data = node.data.slice();
      return { size: data.length, lastModified: 1, arrayBuffer: async () => data.buffer };
    },
    async createWritable() {
      let pending = node.data;
      return {
        async write(chunk: Uint8Array | { arrayBuffer(): Promise<ArrayBuffer> }) {
          pending =
            "arrayBuffer" in chunk
              ? new Uint8Array(await chunk.arrayBuffer())
              : new Uint8Array(chunk);
        },
        async close() {
          node.data = pending;
        },
      };
    },
  };
  return handle as unknown as FileSystemFileHandle;
}

export const emptyDirectory = (name = "root") =>
  directoryHandle(name, { kind: "directory", children: new Map() });
