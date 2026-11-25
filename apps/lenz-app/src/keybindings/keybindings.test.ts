import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { registerCommand } from "../commands";
import { setContextKey } from "../context";
import { handleKeydown, keybindingsFor, registerKeybinding } from ".";

/** A keydown as the dispatcher reads it. */
function press(keys: string) {
  const [modifiers, code] = [keys.split("+").slice(0, -1), keys.split("+").at(-1)!];
  const event = {
    key: code.length === 1 ? code : code,
    code: code.length === 1 ? `Key${code.toUpperCase()}` : code,
    ctrlKey: modifiers.includes("Ctrl"),
    altKey: modifiers.includes("Alt"),
    shiftKey: modifiers.includes("Shift"),
    metaKey: false,
    target: null,
    defaultPrevented: false,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  };
  return {
    event: event as unknown as KeyboardEvent,
    handled: handleKeydown(event as unknown as KeyboardEvent),
    mock: event,
  };
}

const flush = () => new Promise((r) => setTimeout(r, 0));

describe("keybindings", () => {
  const ran = vi.fn();
  const disposables: { dispose(): void }[] = [];
  const command = (id: string, when?: string) =>
    disposables.push(registerCommand({ id, title: id, when, run: (...args) => ran(id, ...args) }));

  beforeEach(() => {
    disposables.splice(0).forEach((d) => d.dispose());
    ran.mockClear();
    setContextKey("mode", undefined);
  });

  it("runs the command of the shortcut, with its args, and consumes the keys", async () => {
    command("a.run");
    disposables.push(registerKeybinding({ key: "Ctrl+Shift+Y", command: "a.run", args: [1, "x"] }));
    const { handled, mock } = press("Ctrl+Shift+Y");
    await flush();
    expect(handled).toBe(true);
    expect(mock.preventDefault).toHaveBeenCalled();
    expect(ran).toHaveBeenCalledWith("a.run", 1, "x");
  });

  it("lets the keys through when nothing is bound", () => {
    const { handled, mock } = press("Ctrl+Shift+U");
    expect(handled).toBe(false);
    expect(mock.preventDefault).not.toHaveBeenCalled();
  });

  it("runs the command only while the `when` of the shortcut holds", async () => {
    command("b.run");
    disposables.push(
      registerKeybinding({ key: "Ctrl+Shift+J", command: "b.run", when: "mode == 'edit'" }),
    );
    press("Ctrl+Shift+J");
    await flush();
    expect(ran).not.toHaveBeenCalled();
    setContextKey("mode", "edit");
    press("Ctrl+Shift+J");
    await flush();
    expect(ran).toHaveBeenCalledTimes(1);
  });

  it("still captures the keys of a shortcut that is not active, so the browser does not act", () => {
    command("b2.run");
    disposables.push(
      registerKeybinding({ key: "Ctrl+Shift+H", command: "b2.run", when: "mode == 'edit'" }),
    );
    const { handled, mock } = press("Ctrl+Shift+H");
    expect(handled).toBe(true);
    expect(mock.preventDefault).toHaveBeenCalled();
    expect(mock.stopPropagation).not.toHaveBeenCalled(); // others may still see it
    expect(ran).not.toHaveBeenCalled();
  });

  it("captures the keys while the command itself is unavailable, without running it", () => {
    command("c.run", "mode == 'edit'");
    disposables.push(registerKeybinding({ key: "Ctrl+Shift+L", command: "c.run" }));
    expect(press("Ctrl+Shift+L").handled).toBe(true);
    expect(ran).not.toHaveBeenCalled();
    setContextKey("mode", "edit");
    expect(press("Ctrl+Shift+L").handled).toBe(true);
  });

  it("captures the keys of a shortcut whose command does not exist", () => {
    disposables.push(registerKeybinding({ key: "Ctrl+Shift+M", command: "nobody.home" }));
    const { handled, mock } = press("Ctrl+Shift+M");
    expect(handled).toBe(true);
    expect(mock.preventDefault).toHaveBeenCalled();
  });

  it("captures the first key of a sequence that is not active", () => {
    command("n.run");
    disposables.push(
      registerKeybinding({
        key: "Ctrl+Shift+N Ctrl+Shift+O",
        command: "n.run",
        when: "mode == 'edit'",
      }),
    );
    expect(press("Ctrl+Shift+N").handled).toBe(true);
    expect(ran).not.toHaveBeenCalled();
  });

  it("the shortcut registered last wins; the other comes back when it is gone", async () => {
    command("d.first");
    command("d.second");
    disposables.push(registerKeybinding({ key: "Ctrl+Shift+K", command: "d.first" }));
    const second = registerKeybinding({ key: "Ctrl+Shift+K", command: "d.second" });
    press("Ctrl+Shift+K");
    await flush();
    expect(ran).toHaveBeenLastCalledWith("d.second");
    second.dispose();
    press("Ctrl+Shift+K");
    await flush();
    expect(ran).toHaveBeenLastCalledWith("d.first");
  });

  it("runs a sequence only once every step is typed", async () => {
    command("e.run");
    disposables.push(registerKeybinding({ key: "Ctrl+K Ctrl+O", command: "e.run" }));
    expect(press("Ctrl+K").handled).toBe(true); // waits for the next step
    expect(ran).not.toHaveBeenCalled();
    expect(press("Ctrl+O").handled).toBe(true);
    await flush();
    expect(ran).toHaveBeenCalledTimes(1);
  });

  it("a wrong second step starts over", async () => {
    command("f.run");
    command("f.other");
    disposables.push(registerKeybinding({ key: "Ctrl+K Ctrl+O", command: "f.run" }));
    disposables.push(registerKeybinding({ key: "Ctrl+Shift+Z", command: "f.other" }));
    press("Ctrl+K");
    expect(press("Ctrl+Shift+Z").handled).toBe(true);
    await flush();
    expect(ran).toHaveBeenCalledWith("f.other");
  });

  it("does not take a bare key typed into a field", () => {
    command("g.run");
    disposables.push(registerKeybinding({ key: "F2", command: "g.run" }));
    const field = { tagName: "INPUT", isContentEditable: false };
    const event = {
      key: "F2",
      code: "F2",
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      target: field,
      preventDefault() {},
      stopPropagation() {},
    };
    expect(handleKeydown(event as unknown as KeyboardEvent)).toBe(false);
    expect(press("F2").handled).toBe(true);
  });

  it("sees a field inside a shadow root, where the event's target is only the host", () => {
    command("sh.run");
    disposables.push(registerKeybinding({ key: "D", command: "sh.run" }));
    const host = { tagName: "DIV", isContentEditable: false };
    const field = { tagName: "INPUT", isContentEditable: false };
    const event = {
      key: "d",
      code: "KeyD",
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      target: host,
      composedPath: () => [field, host],
      preventDefault: vi.fn(),
      stopPropagation() {},
    };
    expect(handleKeydown(event as unknown as KeyboardEvent)).toBe(false);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it("leaves select all, copy and paste to a field, but not to the rest of the page", () => {
    command("sa.run");
    disposables.push(registerKeybinding({ key: "Ctrl+A", command: "sa.run" }));
    const field = { tagName: "TEXTAREA", isContentEditable: false };
    const inField = {
      key: "a",
      code: "KeyA",
      ctrlKey: true,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      target: field,
      preventDefault: vi.fn(),
      stopPropagation() {},
    };
    expect(handleKeydown(inField as unknown as KeyboardEvent)).toBe(false);
    expect(inField.preventDefault).not.toHaveBeenCalled();
    expect(press("Ctrl+A").handled).toBe(true); // not in a field
  });

  it("a field does not keep the other shortcuts with a modifier", () => {
    command("sb.run");
    disposables.push(registerKeybinding({ key: "Ctrl+Shift+B", command: "sb.run" }));
    const field = { tagName: "INPUT", isContentEditable: false };
    const event = {
      key: "B",
      code: "KeyB",
      ctrlKey: true,
      altKey: false,
      shiftKey: true,
      metaKey: false,
      target: field,
      preventDefault() {},
      stopPropagation() {},
    };
    expect(handleKeydown(event as unknown as KeyboardEvent)).toBe(true);
  });

  it("refuses a key it cannot read", () => {
    expect(() => registerKeybinding({ key: "Ctrl+Banana", command: "x" })).toThrow();
    expect(() => registerKeybinding({ key: "Ctrl+S", command: "" })).toThrow();
  });

  it("lists the shortcuts of a command for display, the winning one first", () => {
    disposables.push(registerKeybinding({ key: "Ctrl+Shift+1", command: "h.run" }));
    disposables.push(registerKeybinding({ key: "Ctrl+Shift+2", command: "h.run" }));
    expect(keybindingsFor("h.run")).toEqual(["Ctrl+Shift+2", "Ctrl+Shift+1"]);
  });
});
