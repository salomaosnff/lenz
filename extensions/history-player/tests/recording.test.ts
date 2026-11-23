import { describe, expect, test } from "vite-plus/test";
import {
  InvalidRecordingError,
  duration,
  fileNameOf,
  parseFile,
  toFile,
  type RecordingMeta,
} from "../src/recording";

const meta: RecordingMeta = {
  id: "1",
  name: "Minha gravação",
  startedAt: 1000,
  endedAt: 5000,
  frameCount: 2,
  files: ["a.html"],
};
const frames = [
  { time: 1000, path: "a.html", kind: "open" as const, label: "Aberto", content: "<p>1</p>" },
  { time: 2000, path: "a.html", kind: "record" as const, label: "Editar", content: "<p>2</p>" },
];
const text = (over: object = {}) => JSON.stringify({ ...toFile(meta, frames), ...over });

describe("the recording file", () => {
  test("what is written is read back as it was", () => {
    const file = parseFile(JSON.stringify(toFile(meta, frames)));
    expect(file.name).toBe("Minha gravação");
    expect(file.startedAt).toBe(1000);
    expect(file.endedAt).toBe(5000);
    expect(file.frames).toEqual(frames);
  });

  test("has a format and a version, so a later change can be told apart", () => {
    const file = toFile(meta, frames);
    expect(file).toMatchObject({ format: "lenz-recording", version: 1 });
  });

  test("a recording still in progress is closed at its last frame", () => {
    expect(toFile({ ...meta, endedAt: undefined }, frames).endedAt).toBe(2000);
  });

  test("only the known fields of a frame are written", () => {
    const noisy = [{ ...frames[0]!, id: 7, secret: "x" }] as never;
    expect(Object.keys(toFile(meta, noisy).frames[0]!)).toEqual([
      "time",
      "path",
      "kind",
      "label",
      "content",
    ]);
  });
});

describe("parseFile refuses what is not a recording", () => {
  const rejects = (input: string, message: RegExp) => {
    expect(() => parseFile(input)).toThrow(InvalidRecordingError);
    expect(() => parseFile(input)).toThrow(message);
  };

  test("not JSON, or not an object", () => {
    rejects("{ nope", /JSON/);
    rejects("42", /não é uma gravação/);
    rejects("null", /não é uma gravação/);
    rejects("[]", /não é uma gravação do Lenz/);
  });

  test("another format or version", () => {
    rejects(text({ format: "other" }), /não é uma gravação do Lenz/);
    rejects(text({ version: 2 }), /Versão 2/);
  });

  test("frames that are missing or wrong", () => {
    rejects(text({ frames: "x" }), /lista de quadros/);
    rejects(text({ frames: [null] }), /Quadro 1 não é válido/);
    rejects(text({ frames: [{ ...frames[0], time: "yesterday" }] }), /horário/);
    rejects(text({ frames: [{ ...frames[0], path: "" }] }), /caminho/);
    rejects(text({ frames: [{ ...frames[0], kind: "explode" }] }), /tipo desconhecido/);
    rejects(text({ frames: [{ ...frames[0], label: 5 }] }), /rótulo/);
    rejects(text({ frames: [{ ...frames[0], content: null }] }), /conteúdo/);
  });

  test("frames out of order", () => {
    rejects(text({ frames: [frames[1], frames[0]] }), /ordem/);
  });

  test("fills in what the header lacks", () => {
    const file = parseFile(text({ name: "  ", startedAt: undefined, endedAt: undefined }));
    expect(file.name).toBe("Gravação importada");
    expect(file.startedAt).toBe(1000);
    expect(file.endedAt).toBe(2000);
  });

  test("an empty recording is a valid one", () => {
    expect(parseFile(text({ frames: [] })).frames).toEqual([]);
  });
});

describe("helpers", () => {
  test("a safe file name", () => {
    expect(fileNameOf("Gravação 23/11 14:05")).toBe("gravacao-23-11-14-05.lenzrec.json");
    expect(fileNameOf("///")).toBe("gravacao.lenzrec.json");
  });

  test("durations", () => {
    expect(duration(0)).toBe("0:00");
    expect(duration(65_400)).toBe("1:05");
    expect(duration(3_725_000)).toBe("1:02:05");
  });
});
