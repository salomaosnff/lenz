import { readFileSync } from "node:fs";
import { describe, expect, test, vi } from "vite-plus/test";
import type { HistoryChange } from "lenz-sdk";
import { Controller, type HistorySource } from "../src/controller";
import { MemoryStore } from "../src/storage";
import { createTools } from "../src/tools";

function setup() {
  const listeners = new Set<(c: HistoryChange) => void>();
  const source: HistorySource = {
    list: () => [],
    onDidOpen: () => ({ dispose() {} }),
    onDidChange: (fn) => (listeners.add(fn), { dispose: () => void listeners.delete(fn) }),
  };
  let clock = 1_000;
  const controller = new Controller(new MemoryStore(), source, {
    now: () => (clock += 10),
    autosaveDelay: 1,
    nameFor: () => "Gravação de teste",
  });
  const hooks = { start: vi.fn(() => void controller.start()), stopped: vi.fn() };
  const tools = createTools(controller, hooks);
  return { controller, hooks, tools };
}

describe("the tools of the recordings", () => {
  test("stop and save a recording without asking for anything", async () => {
    const { tools, hooks, controller } = setup();
    await tools.start_recording!({});
    expect(controller.active.value).not.toBeNull();
    const result = (await tools.stop_recording!({})) as { name: string; recording: boolean };
    expect(result).toMatchObject({ recording: false, name: "Gravação de teste" });
    expect(hooks.stopped).toHaveBeenCalled(); // the message "recording..." goes away
    expect(controller.recordings.value.map((m) => m.name)).toEqual(["Gravação de teste"]);
  });

  test("give the recording a name when it stops", async () => {
    const { tools, controller } = setup();
    await tools.start_recording!({});
    await tools.stop_recording!({ name: "  Tour da página  " });
    expect(controller.recordings.value.map((m) => m.name)).toEqual(["Tour da página"]);
  });

  test("say so when there is nothing to stop, and when the name is not a name", async () => {
    const { tools } = setup();
    await expect(tools.stop_recording!({})).rejects.toThrow(/no recording in progress/);
    await expect(tools.stop_recording!({ name: 3 })).rejects.toThrow(/"name" must be/);
  });

  test("do not start a second recording", async () => {
    const { tools, hooks } = setup();
    expect(await tools.start_recording!({})).toMatchObject({ recording: true, already: false });
    expect(await tools.start_recording!({})).toMatchObject({ recording: true, already: true });
    expect(hooks.start).toHaveBeenCalledTimes(1);
  });

  test("list, rename and delete saved recordings, but not the one in progress", async () => {
    const { tools } = setup();
    await tools.start_recording!({});
    await tools.stop_recording!({});
    await tools.start_recording!({});
    const listed = (await tools.list_recordings!({})) as {
      recording: { id: string } | null;
      recordings: { id: string; name: string }[];
    };
    expect(listed.recording).not.toBeNull();
    const saved = listed.recordings.find((r) => r.id !== listed.recording!.id)!;

    await tools.rename_recording!({ id: saved.id, name: "Antiga" });
    expect(
      ((await tools.list_recordings!({})) as typeof listed).recordings.map((r) => r.name),
    ).toContain("Antiga");
    await expect(tools.delete_recording!({ id: listed.recording!.id })).rejects.toThrow(
      /stop it first/,
    );
    await tools.delete_recording!({ id: saved.id });
    await expect(tools.delete_recording!({ id: saved.id })).rejects.toThrow(/no recording/);
  });

  test("are the ones the package declares", () => {
    const manifest = JSON.parse(
      readFileSync(new URL("../package.json", import.meta.url), "utf8"),
    ) as {
      contributes: { tools: { name: string }[] };
    };
    const { tools } = setup();
    expect(manifest.contributes.tools.map((t) => t.name).sort()).toEqual(Object.keys(tools).sort());
  });
});
