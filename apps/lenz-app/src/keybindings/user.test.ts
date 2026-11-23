import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { registerCommand } from "../commands";
import { setContextKey } from "../context";
import {
  handleKeydown,
  isCustomized,
  keybindingsFor,
  registerKeybinding,
  resetUserKeybinding,
  setUserKeybinding,
} from ".";

vi.stubGlobal("localStorage", { getItem: () => null, setItem: () => {} });

const press = (code: string, ctrl = true) =>
  handleKeydown({
    key: code,
    code: `Key${code.toUpperCase()}`,
    ctrlKey: ctrl,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    target: null,
    preventDefault() {},
    stopPropagation() {},
  } as unknown as KeyboardEvent);

afterEach(() => resetUserKeybinding("user.cmd"));

describe("shortcuts chosen by the user", () => {
  it("replace the ones a command came with, and going back restores them", async () => {
    const run = vi.fn();
    const command = registerCommand({ id: "user.cmd", title: "Test", run });
    const binding = registerKeybinding({ key: "Ctrl+Q", command: "user.cmd" });

    setUserKeybinding("user.cmd", "Ctrl+W");
    expect(keybindingsFor("user.cmd")).toEqual(["Ctrl+W"]);
    expect(isCustomized("user.cmd")).toBe(true);
    press("q"); // the old key no longer runs it
    expect(run).not.toHaveBeenCalled();
    press("w");
    await Promise.resolve();
    expect(run).toHaveBeenCalledTimes(1);

    setUserKeybinding("user.cmd", null);
    expect(keybindingsFor("user.cmd")).toEqual([]);

    resetUserKeybinding("user.cmd");
    expect(keybindingsFor("user.cmd")).toEqual(["Ctrl+Q"]);
    expect(isCustomized("user.cmd")).toBe(false);
    binding.dispose();
    command.dispose();
  });

  it("takes the condition the user gives, and refuses one that is not valid", async () => {
    const run = vi.fn();
    const command = registerCommand({ id: "user.cmd", title: "Test", run });
    setUserKeybinding("user.cmd", "Ctrl+E", "flag");
    press("e"); // the condition does not hold yet
    await Promise.resolve();
    expect(run).not.toHaveBeenCalled();
    setContextKey("flag", true);
    press("e");
    await Promise.resolve();
    expect(run).toHaveBeenCalledTimes(1);
    setContextKey("flag", undefined);
    expect(() => setUserKeybinding("user.cmd", "Ctrl+R", "a &&")).toThrow();
    expect(keybindingsFor("user.cmd")).toEqual(["Ctrl+E"]);
    command.dispose();
  });

  it("refuses a key it cannot read", () => {
    expect(() => setUserKeybinding("user.cmd", "Ctrl+Nope")).toThrow(/Unknown key/);
    expect(isCustomized("user.cmd")).toBe(false);
  });
});
