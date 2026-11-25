import { describe, expect, it } from "vite-plus/test";
import { HandleFileSystem } from "./handle";
import { emptyDirectory } from "./testing";
import { writeTextFile } from "./types";
import { createZip, crc32, zipFileSystem } from "./zip";

const text = (s: string) => new TextEncoder().encode(s);

/** Reads back what a zip says about its entries, from the central directory. */
function list(zip: Uint8Array) {
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  const end = zip.length - 22;
  expect(view.getUint32(end, true)).toBe(0x06054b50);
  const count = view.getUint16(end + 10, true);
  let at = view.getUint32(end + 16, true);
  const entries: { name: string; size: number; crc: number; content: string }[] = [];
  for (let i = 0; i < count; i++) {
    expect(view.getUint32(at, true)).toBe(0x02014b50);
    const crc = view.getUint32(at + 16, true);
    const size = view.getUint32(at + 24, true);
    const nameLength = view.getUint16(at + 28, true);
    const local = view.getUint32(at + 42, true);
    const name = new TextDecoder().decode(zip.subarray(at + 46, at + 46 + nameLength));
    // The local header repeats the name; the data follows it.
    expect(view.getUint32(local, true)).toBe(0x04034b50);
    const start = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true);
    entries.push({
      name,
      size,
      crc,
      content: new TextDecoder().decode(zip.subarray(start, start + size)),
    });
    at += 46 + nameLength;
  }
  return entries;
}

describe("crc32", () => {
  it("matches the known check value", () => {
    expect(crc32(text("123456789"))).toBe(0xcbf43926);
    expect(crc32(new Uint8Array())).toBe(0);
  });
});

describe("createZip", () => {
  it("stores every entry, with its name, size and checksum", () => {
    const zip = createZip([
      { path: "a.html", data: text("<h1>oi</h1>") },
      { path: "pasta/" },
      { path: "pasta/ação.html", data: text("ñ") },
    ]);
    expect(list(zip)).toEqual([
      { name: "a.html", size: 11, crc: crc32(text("<h1>oi</h1>")), content: "<h1>oi</h1>" },
      { name: "pasta/", size: 0, crc: 0, content: "" },
      { name: "pasta/ação.html", size: 2, crc: crc32(text("ñ")), content: "ñ" },
    ]);
  });

  it("makes a valid empty zip", () => {
    expect(list(createZip([]))).toEqual([]);
  });
});

describe("zipFileSystem", () => {
  it("zips the whole tree", async () => {
    class Memory extends HandleFileSystem {
      readonly kind = "memory";
    }
    const fs = new Memory(emptyDirectory());
    await writeTextFile(fs, "index.html", "home");
    await writeTextFile(fs, "pages/deep/team.html", "team");
    await fs.createDirectory("empty");
    const blob = await zipFileSystem(fs);
    const names = list(new Uint8Array(await blob.arrayBuffer())).map((e) => e.name);
    expect(names.sort()).toEqual(
      ["empty/", "index.html", "pages/", "pages/deep/", "pages/deep/team.html"].sort(),
    );
  });
});
