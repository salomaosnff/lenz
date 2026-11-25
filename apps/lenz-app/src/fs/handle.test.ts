import { beforeEach, describe, expect, it } from "vite-plus/test";
import { HandleFileSystem } from "./handle";
import { emptyDirectory } from "./testing";
import { FileSystemError, exists, readTextFile, writeTextFile } from "./types";
import { basename, dirname, joinPath, normalizePath, splitPath } from "./path";

class TestFileSystem extends HandleFileSystem {
  readonly kind = "test";
}

let fs: TestFileSystem;
beforeEach(() => {
  fs = new TestFileSystem(emptyDirectory());
});

const code = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (error) {
    return error instanceof FileSystemError ? error.code : error;
  }
  return undefined;
};

describe("paths", () => {
  it("normalizes", () => {
    expect(normalizePath("/a//b/./c/")).toBe("a/b/c");
    expect(normalizePath("")).toBe("");
    expect(joinPath("a/", "/b", "c.html")).toBe("a/b/c.html");
    expect(basename("a/b/c.html")).toBe("c.html");
    expect(dirname("a/b/c.html")).toBe("a/b");
    expect(dirname("c.html")).toBe("");
  });

  it("refuses to leave the root", () => {
    expect(() => splitPath("a/../../b")).toThrow(FileSystemError);
  });
});

describe("files", () => {
  it("writes and reads text, creating the directories above", async () => {
    await writeTextFile(fs, "pages/a/index.html", "<h1>oi</h1>");
    expect(await readTextFile(fs, "pages/a/index.html")).toBe("<h1>oi</h1>");
    expect(await fs.stat("pages/a/index.html")).toMatchObject({ type: "file", size: 11 });
    expect((await fs.stat("pages")).type).toBe("directory");
  });

  it("overwrites a file", async () => {
    await writeTextFile(fs, "a.html", "one");
    await writeTextFile(fs, "a.html", "two");
    expect(await readTextFile(fs, "a.html")).toBe("two");
  });

  it("reports what is missing or of the wrong kind", async () => {
    await writeTextFile(fs, "dir/a.html", "x");
    expect(await code(fs.readFile("nope.html"))).toBe("NotFound");
    expect(await code(fs.readFile("dir"))).toBe("IsADirectory");
    expect(await code(fs.readDirectory("dir/a.html"))).toBe("NotADirectory");
    expect(await code(writeTextFile(fs, "dir", "x"))).toBe("IsADirectory");
    expect(await code(fs.stat("dir/missing/deeper"))).toBe("NotFound");
    expect(await exists(fs, "dir/a.html")).toBe(true);
    expect(await exists(fs, "dir/b.html")).toBe(false);
  });

  it("refuses a binary file as text", async () => {
    await fs.writeFile("img.png", new Uint8Array([0xff, 0xfe, 0x00, 0x80]));
    await expect(readTextFile(fs, "img.png")).rejects.toBeInstanceOf(TypeError);
  });
});

describe("directories", () => {
  it("lists directories first, then by name", async () => {
    await writeTextFile(fs, "b.html", "");
    await writeTextFile(fs, "a.html", "");
    await fs.createDirectory("z");
    await fs.createDirectory("m");
    expect(await fs.readDirectory("")).toEqual([
      { name: "m", type: "directory" },
      { name: "z", type: "directory" },
      { name: "a.html", type: "file" },
      { name: "b.html", type: "file" },
    ]);
    expect(await fs.readDirectory("/")).toEqual(await fs.readDirectory(""));
  });

  it("creates parents, and is fine with one that exists", async () => {
    await fs.createDirectory("a/b/c");
    await fs.createDirectory("a/b");
    expect((await fs.stat("a/b/c")).type).toBe("directory");
  });

  it("deletes a non-empty directory only when recursive", async () => {
    await writeTextFile(fs, "d/a.html", "x");
    expect(await code(fs.delete("d"))).toBe("NotEmpty");
    await fs.delete("d", { recursive: true });
    expect(await exists(fs, "d")).toBe(false);
    expect(await code(fs.delete(""))).toBe("InvalidPath");
  });
});

describe("rename", () => {
  it("moves a file", async () => {
    await writeTextFile(fs, "a.html", "x");
    await fs.rename("a.html", "pages/b.html");
    expect(await exists(fs, "a.html")).toBe(false);
    expect(await readTextFile(fs, "pages/b.html")).toBe("x");
  });

  it("moves a directory with what is in it", async () => {
    await writeTextFile(fs, "d/one.html", "1");
    await writeTextFile(fs, "d/sub/two.html", "2");
    await fs.rename("d", "e");
    expect(await exists(fs, "d")).toBe(false);
    expect(await readTextFile(fs, "e/one.html")).toBe("1");
    expect(await readTextFile(fs, "e/sub/two.html")).toBe("2");
  });

  it("does not replace something unless asked", async () => {
    await writeTextFile(fs, "a.html", "a");
    await writeTextFile(fs, "b.html", "b");
    expect(await code(fs.rename("a.html", "b.html"))).toBe("Exists");
    expect(await readTextFile(fs, "b.html")).toBe("b");
    await fs.rename("a.html", "b.html", { overwrite: true });
    expect(await readTextFile(fs, "b.html")).toBe("a");
  });

  it("refuses to move a directory into itself", async () => {
    await fs.createDirectory("d");
    expect(await code(fs.rename("d", "d/inner"))).toBe("InvalidPath");
  });
});
