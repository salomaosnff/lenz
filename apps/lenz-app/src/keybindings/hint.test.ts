import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { registerCommand } from "../commands";
import { handleKeydown, handleModifiers, hideWhenLetGo, keyHint, registerKeybinding } from ".";

const event = (type: string, key: string, mods: { ctrl?: boolean } = {}) =>
  ({
    type,
    key,
    code: key.length === 1 ? `Key${key.toUpperCase()}` : key,
    ctrlKey: !!mods.ctrl,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    target: null,
    preventDefault() {},
    stopPropagation() {},
  }) as unknown as KeyboardEvent;

const disposables: { dispose(): void }[] = [];
beforeEach(() => {
  vi.useFakeTimers();
  const add = (id: string, title: string, key: string) => {
    disposables.push(registerCommand({ id, title, category: "Hint", run: () => {} }));
    disposables.push(registerKeybinding({ key, command: id }));
  };
  add("hint.undo", "Desfazer", "Ctrl+Z");
  add("hint.redo", "Refazer", "Ctrl+Y");
  add("hint.keys", "Atalhos", "Ctrl+K Ctrl+S");
  add("hint.other", "Outro", "Alt+O");
});
afterEach(() => {
  disposables.splice(0).forEach((d) => d.dispose());
  handleModifiers(event("keyup", "Control"));
  vi.useRealTimers();
});

describe("the hint of the keys pressed", () => {
  it("holding Ctrl shows, after a short wait, the shortcuts that use it", () => {
    handleModifiers(event("keydown", "Control", { ctrl: true }));
    expect(keyHint.value).toBeNull(); // a quick shortcut must not flash it
    vi.advanceTimersByTime(500);
    expect(keyHint.value?.pressed).toBe("Ctrl");
    const titles = keyHint.value!.items.map((i) => i.title);
    expect(titles).toEqual(expect.arrayContaining(["Desfazer", "Refazer", "Atalhos"]));
    expect(titles).not.toContain("Outro"); // that one uses Alt
    expect(keyHint.value!.items.find((i) => i.title === "Desfazer")?.keys).toBe("Ctrl+Z");
  });

  it("letting go, or pressing a key, takes it away", () => {
    handleModifiers(event("keydown", "Control", { ctrl: true }));
    vi.advanceTimersByTime(500);
    handleModifiers(event("keyup", "Control"));
    expect(keyHint.value).toBeNull();

    handleModifiers(event("keydown", "Control", { ctrl: true }));
    vi.advanceTimersByTime(500);
    handleModifiers(event("keydown", "z", { ctrl: true }));
    expect(keyHint.value).toBeNull();
  });

  it("a quick shortcut never shows it", () => {
    handleModifiers(event("keydown", "Control", { ctrl: true }));
    handleModifiers(event("keydown", "z", { ctrl: true }));
    handleModifiers(event("keyup", "z", { ctrl: true }));
    vi.advanceTimersByTime(1000);
    expect(keyHint.value).toBeNull();
  });

  it("in the middle of a sequence it shows what can come next, at once", () => {
    handleKeydown(event("keydown", "k", { ctrl: true }));
    expect(keyHint.value?.pressed).toBe("Ctrl+K");
    expect(keyHint.value!.items.map((i) => [i.keys, i.title])).toEqual([
      ["Ctrl+K Ctrl+S", "Atalhos"],
    ]);
    handleKeydown(event("keydown", "s", { ctrl: true })); // completes it
    expect(keyHint.value).toBeNull();
  });

  it("follows the modifiers held: letting go of Shift goes back to the Ctrl shortcuts only", () => {
    disposables.push(registerCommand({ id: "hint.shifted", title: "Com Shift", run: () => {} }));
    disposables.push(registerKeybinding({ key: "Ctrl+Shift+P", command: "hint.shifted" }));
    const both = { ...event("keydown", "Shift", { ctrl: true }), shiftKey: true } as KeyboardEvent;
    handleModifiers(event("keydown", "Control", { ctrl: true }));
    vi.advanceTimersByTime(500);
    expect(keyHint.value!.items.map((i) => i.title)).not.toContain("Com Shift");
    handleModifiers(both);
    expect(keyHint.value?.pressed).toBe("Ctrl+Shift");
    expect(keyHint.value!.items.map((i) => i.title)).toEqual(["Com Shift"]);
    handleModifiers(event("keyup", "Shift", { ctrl: true }));
    expect(keyHint.value?.pressed).toBe("Ctrl");
    expect(keyHint.value!.items.map((i) => i.title)).not.toContain("Com Shift");
  });

  it("goes away on a mouse event that shows no modifier held, even if the key release was missed", () => {
    handleModifiers(event("keydown", "Control", { ctrl: true }));
    vi.advanceTimersByTime(500);
    expect(keyHint.value).not.toBeNull();
    hideWhenLetGo({ ctrlKey: true, altKey: false, shiftKey: false, metaKey: false } as MouseEvent);
    expect(keyHint.value).not.toBeNull(); // still held
    hideWhenLetGo({ ctrlKey: false, altKey: false, shiftKey: false, metaKey: false } as MouseEvent);
    expect(keyHint.value).toBeNull();
  });

  it("goes away when everything is let go, and comes back when a modifier is held again", () => {
    handleKeydown(event("keydown", "k", { ctrl: true }));
    handleModifiers(event("keyup", "k", { ctrl: true })); // Ctrl still held
    expect(keyHint.value).not.toBeNull();
    handleModifiers(event("keyup", "Control")); // nothing held now
    expect(keyHint.value).toBeNull();
    handleModifiers(event("keydown", "Control", { ctrl: true }));
    expect(keyHint.value?.pressed).toBe("Ctrl+K"); // the sequence was still waiting
    handleKeydown(event("keydown", "s", { ctrl: true }));
    expect(keyHint.value).toBeNull();
  });
});
