import { describe, expect, it } from "vite-plus/test";
import { chordOf, formatKey, parseKey, sameChord, startsWith, type KeyLike } from "./keys";

const event = (over: Partial<KeyLike>): KeyLike => ({
  key: "",
  code: "",
  ctrlKey: false,
  altKey: false,
  shiftKey: false,
  metaKey: false,
  ...over,
});

describe("parseKey", () => {
  it("reads modifiers and a key, in any case and order", () => {
    expect(parseKey("Ctrl+Shift+P", false)[0]).toEqual({
      ctrl: true,
      alt: false,
      shift: true,
      meta: false,
      key: "p",
    });
    expect(parseKey("shift+CTRL+p", false)).toEqual(parseKey("Ctrl+Shift+P", false));
  });

  it("reads sequences", () => {
    const steps = parseKey("Ctrl+K Ctrl+O", false);
    expect(steps.map((s) => s.key)).toEqual(["k", "o"]);
    expect(steps.every((s) => s.ctrl)).toBe(true);
  });

  it("Mod is Cmd on a Mac and Ctrl elsewhere", () => {
    expect(parseKey("Mod+S", true)[0]).toMatchObject({ meta: true, ctrl: false });
    expect(parseKey("Mod+S", false)[0]).toMatchObject({ meta: false, ctrl: true });
  });

  it("knows names, aliases and punctuation", () => {
    expect(parseKey("Esc")[0]!.key).toBe("escape");
    expect(parseKey("Alt+Up")[0]!.key).toBe("arrowup");
    expect(parseKey("Ctrl+Space", false)[0]!.key).toBe("space");
    expect(parseKey("F12")[0]!.key).toBe("f12");
    expect(parseKey("Ctrl+,", false)[0]!.key).toBe(",");
    expect(parseKey("Ctrl++", false)[0]!.key).toBe("+");
  });

  it("refuses what it does not understand", () => {
    expect(() => parseKey("")).toThrow();
    expect(() => parseKey("Hyper+A")).toThrow(/modifier/);
    expect(() => parseKey("Ctrl+Banana")).toThrow(/key/);
    expect(() => parseKey("Ctrl+F25")).toThrow();
  });
});

describe("chordOf", () => {
  it("uses the physical key for letters and digits, even with Shift or Alt", () => {
    expect(chordOf(event({ key: "P", code: "KeyP", ctrlKey: true, shiftKey: true }))).toEqual(
      parseKey("Ctrl+Shift+P", false)[0],
    );
    expect(chordOf(event({ key: "¡", code: "Digit1", altKey: true }))!.key).toBe("1");
  });

  it("names the special keys", () => {
    expect(chordOf(event({ key: " ", code: "Space", ctrlKey: true }))).toEqual(
      parseKey("Ctrl+Space", false)[0],
    );
    expect(chordOf(event({ key: "ArrowUp", code: "ArrowUp", altKey: true }))).toEqual(
      parseKey("Alt+Up")[0],
    );
    expect(chordOf(event({ key: "F2", code: "F2" }))!.key).toBe("f2");
  });

  it("ignores a modifier pressed alone", () => {
    expect(chordOf(event({ key: "Control", code: "ControlLeft", ctrlKey: true }))).toBeNull();
  });
});

describe("matching", () => {
  it("compares chords and sequence prefixes", () => {
    const [a, b] = parseKey("Ctrl+K Ctrl+O", false);
    expect(sameChord(a!, b!)).toBe(false);
    expect(startsWith([a!, b!], [a!])).toBe(true);
    expect(startsWith([a!, b!], [b!])).toBe(false);
    expect(startsWith([a!], [a!, b!])).toBe(false);
  });
});

describe("formatKey", () => {
  it("writes the shortcut for people", () => {
    expect(formatKey(parseKey("ctrl+shift+s", false), false)).toBe("Ctrl+Shift+S");
    expect(formatKey(parseKey("Ctrl+K Ctrl+O", false), false)).toBe("Ctrl+K Ctrl+O");
    expect(formatKey(parseKey("alt+up", false), false)).toBe("Alt+Up");
    expect(formatKey(parseKey("Mod+Space", true), true)).toBe("Cmd+Space");
  });
});
