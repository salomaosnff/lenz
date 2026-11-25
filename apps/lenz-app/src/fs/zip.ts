import { joinPath } from "./path";
import type { FileSystemProvider } from "./types";

export interface ZipEntry {
  /** Relative, with `/`. A directory ends in `/` and has no data. */
  path: string;
  data?: Uint8Array;
  /** ms since the epoch. */
  mtime?: number;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) crc = CRC_TABLE[(crc ^ byte) & 0xff]! ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/** MS-DOS time and date, which is what a zip stores. */
function dosDateTime(ms: number): { time: number; date: number } {
  const d = new Date(ms);
  // The format starts in 1980.
  const year = Math.max(d.getFullYear(), 1980);
  return {
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
    date: ((year - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  };
}

/** A zip with every file stored as it is (no compression). Enough for a project of text files. */
export function createZip(entries: ZipEntry[], now = Date.now()): Uint8Array {
  if (entries.length > 0xffff) throw new Error("Arquivos demais para um zip.");
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = encoder.encode(entry.path);
    const data = entry.data ?? new Uint8Array();
    const crc = crc32(data);
    const { time, date } = dosDateTime(entry.mtime || now);
    const isDirectory = entry.path.endsWith("/");
    if (offset + data.length >= 0xffffffff)
      throw new Error("O projeto é grande demais para um zip.");

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true); // version needed
    local.setUint16(6, 0x0800, true); // flags: names are UTF-8
    local.setUint16(8, 0, true); // method: stored
    local.setUint16(10, time, true);
    local.setUint16(12, date, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, name.length, true);
    local.setUint16(28, 0, true);

    const header = new DataView(new ArrayBuffer(46));
    header.setUint32(0, 0x02014b50, true);
    header.setUint16(4, 20, true); // version made by
    header.setUint16(6, 20, true);
    header.setUint16(8, 0x0800, true);
    header.setUint16(10, 0, true);
    header.setUint16(12, time, true);
    header.setUint16(14, date, true);
    header.setUint32(16, crc, true);
    header.setUint32(20, data.length, true);
    header.setUint32(24, data.length, true);
    header.setUint16(28, name.length, true);
    header.setUint32(38, isDirectory ? 0x10 : 0, true); // external attributes: directory
    header.setUint32(42, offset, true);

    parts.push(new Uint8Array(local.buffer), name, data);
    central.push(new Uint8Array(header.buffer), name);
    offset += 30 + name.length + data.length;
  }

  const centralSize = central.reduce((sum, part) => sum + part.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, entries.length, true);
  end.setUint16(10, entries.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);

  const all = [...parts, ...central, new Uint8Array(end.buffer)];
  const zip = new Uint8Array(all.reduce((sum, part) => sum + part.length, 0));
  let at = 0;
  for (const part of all) {
    zip.set(part, at);
    at += part.length;
  }
  return zip;
}

/** Every file and folder of a file system, as zip entries. */
async function collect(fs: FileSystemProvider, path: string, into: ZipEntry[]) {
  for (const entry of await fs.readDirectory(path)) {
    const child = joinPath(path, entry.name);
    if (entry.type === "directory") {
      into.push({ path: `${child}/` });
      await collect(fs, child, into);
    } else {
      const [data, stat] = await Promise.all([fs.readFile(child), fs.stat(child)]);
      into.push({ path: child, data, mtime: stat.mtime });
    }
  }
}

export async function zipFileSystem(fs: FileSystemProvider): Promise<Blob> {
  const entries: ZipEntry[] = [];
  await collect(fs, "", entries);
  return new Blob([createZip(entries) as BlobPart], { type: "application/zip" });
}

/** Hands a blob to the browser as a download. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  // The download has started by the next turn; the URL is not needed after that.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
