import type { Frame, FrameKind } from "./recorder";

/** What is known about a recording without loading its frames: enough to list it. */
export interface RecordingMeta {
  id: string;
  name: string;
  /** `Date.now()` when it started. */
  startedAt: number;
  /** When it stopped; `undefined` while it is being recorded. */
  endedAt?: number;
  frameCount: number;
  /** The files it touches, in the order they first appeared. */
  files: string[];
}

/** A frame as it is saved: the id is given again when it is loaded. */
export type SavedFrame = Omit<Frame, "id">;

export const FORMAT = "lenz-recording";
export const VERSION = 1;

/** The file a recording is downloaded as. */
export interface RecordingFile {
  format: typeof FORMAT;
  version: typeof VERSION;
  name: string;
  startedAt: number;
  endedAt: number;
  frames: SavedFrame[];
}

const KINDS: readonly FrameKind[] = [
  "open",
  "close",
  "record",
  "merge",
  "undo",
  "redo",
  "goto",
  "clear",
];
/** A guard: a file with more frames than this is not something the recorder made. */
export const MAX_FRAMES = 50_000;

export function toFile(meta: RecordingMeta, frames: readonly SavedFrame[]): RecordingFile {
  return {
    format: FORMAT,
    version: VERSION,
    name: meta.name,
    startedAt: meta.startedAt,
    endedAt: meta.endedAt ?? frames.at(-1)?.time ?? meta.startedAt,
    frames: frames.map(({ time, path, kind, label, content }) => ({
      time,
      path,
      kind,
      label,
      content,
    })),
  };
}

export class InvalidRecordingError extends Error {}

const fail = (message: string): never => {
  throw new InvalidRecordingError(message);
};
const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const isText = (value: unknown): value is string => typeof value === "string";

/**
 * Reads the text of a recording file. Throws `InvalidRecordingError`, in Portuguese, saying what is
 * wrong with it: this is data from outside, so nothing is taken on faith.
 */
export function parseFile(text: string): RecordingFile {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return fail("O arquivo não é um JSON válido.");
  }
  if (!data || typeof data !== "object") return fail("O arquivo não é uma gravação.");
  const file = data as Record<string, unknown>;
  if (file.format !== FORMAT) return fail("O arquivo não é uma gravação do Lenz.");
  if (file.version !== VERSION)
    return fail(`Versão ${String(file.version)} da gravação não é suportada.`);
  if (!Array.isArray(file.frames)) return fail("A gravação não tem a lista de quadros.");
  if (file.frames.length > MAX_FRAMES) return fail("A gravação tem quadros demais.");

  const frames = file.frames.map((raw, index): SavedFrame => {
    const frame = raw as Record<string, unknown> | null;
    const where = `Quadro ${index + 1}`;
    if (!frame || typeof frame !== "object") return fail(`${where} não é válido.`);
    if (!isNumber(frame.time)) return fail(`${where} não tem um horário válido.`);
    if (!isText(frame.path) || !frame.path) return fail(`${where} não tem o caminho do arquivo.`);
    if (!KINDS.includes(frame.kind as FrameKind)) return fail(`${where} tem um tipo desconhecido.`);
    if (!isText(frame.label)) return fail(`${where} não tem um rótulo.`);
    if (!isText(frame.content)) return fail(`${where} não tem o conteúdo.`);
    return {
      time: frame.time,
      path: frame.path,
      kind: frame.kind as FrameKind,
      label: frame.label,
      content: frame.content,
    };
  });
  // The frames are played in order: a recording out of order would jump back in time.
  for (let i = 1; i < frames.length; i++) {
    if (frames[i]!.time < frames[i - 1]!.time)
      return fail(`Os quadros não estão em ordem (quadro ${i + 1}).`);
  }

  const startedAt = isNumber(file.startedAt) ? file.startedAt : (frames[0]?.time ?? Date.now());
  return {
    format: FORMAT,
    version: VERSION,
    name:
      isText(file.name) && file.name.trim() ? file.name.trim().slice(0, 120) : "Gravação importada",
    startedAt,
    endedAt: isNumber(file.endedAt) ? file.endedAt : (frames.at(-1)?.time ?? startedAt),
    frames,
  };
}

/** A safe name for the downloaded file. */
export function fileNameOf(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return `${base || "gravacao"}.lenzrec.json`;
}

/** `m:ss`, or `h:mm:ss` from an hour on. */
export function duration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}
