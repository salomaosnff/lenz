import type { RecordingMeta, SavedFrame } from "./recording";

/** Where the recordings live. The list reads only the small records; frames are loaded on demand. */
export interface RecordingStore {
  list(): Promise<RecordingMeta[]>;
  load(id: string): Promise<SavedFrame[] | undefined>;
  save(meta: RecordingMeta, frames: readonly SavedFrame[]): Promise<void>;
  remove(id: string): Promise<void>;
}

/** For tests, and for a browser that has no IndexedDB (private windows of some browsers). */
export class MemoryStore implements RecordingStore {
  private metas = new Map<string, RecordingMeta>();
  private data = new Map<string, SavedFrame[]>();
  async list() {
    return [...this.metas.values()].map((m) => ({ ...m, files: [...m.files] }));
  }
  async load(id: string) {
    return this.data.get(id)?.map((f) => ({ ...f }));
  }
  async save(meta: RecordingMeta, frames: readonly SavedFrame[]) {
    this.metas.set(meta.id, { ...meta, files: [...meta.files] });
    this.data.set(
      meta.id,
      frames.map((f) => ({ ...f })),
    );
  }
  async remove(id: string) {
    this.metas.delete(id);
    this.data.delete(id);
  }
}

const DB_NAME = "lenz-history-player";
const META = "recordings";
const FRAMES = "frames";

const request = <T>(req: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const finished = (tx: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("A gravação não pôde ser guardada."));
  });

/** Recordings in IndexedDB: one store for the list, another for the frames of each one. */
export class IndexedDbStore implements RecordingStore {
  private db: Promise<IDBDatabase> | undefined;

  private open() {
    this.db ??= new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore(META, { keyPath: "id" });
        req.result.createObjectStore(FRAMES, { keyPath: "id" });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return this.db;
  }

  async list() {
    const db = await this.open();
    return request<RecordingMeta[]>(db.transaction(META).objectStore(META).getAll());
  }

  async load(id: string) {
    const db = await this.open();
    const row = await request<{ id: string; frames: SavedFrame[] } | undefined>(
      db.transaction(FRAMES).objectStore(FRAMES).get(id),
    );
    return row?.frames;
  }

  async save(meta: RecordingMeta, frames: readonly SavedFrame[]) {
    const db = await this.open();
    // One transaction: the list never shows a recording whose frames were not written.
    const tx = db.transaction([META, FRAMES], "readwrite");
    tx.objectStore(META).put(JSON.parse(JSON.stringify(meta)));
    tx.objectStore(FRAMES).put({ id: meta.id, frames: frames.map((f) => ({ ...f })) });
    await finished(tx);
  }

  async remove(id: string) {
    const db = await this.open();
    const tx = db.transaction([META, FRAMES], "readwrite");
    tx.objectStore(META).delete(id);
    tx.objectStore(FRAMES).delete(id);
    await finished(tx);
  }
}

/** IndexedDB when the browser has it, memory otherwise. */
export const defaultStore = (): RecordingStore =>
  typeof indexedDB === "undefined" ? new MemoryStore() : new IndexedDbStore();
