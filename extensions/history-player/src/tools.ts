import type { Controller } from "./controller";
import type { RecordingMeta } from "./recording";

type Input = Record<string, unknown>;

/** What the extension does around the controller that the tools must also do. */
export interface ToolHooks {
  /** Starts a recording, with the message that says it is going. */
  start(): void;
  /** Takes away the message that says a recording is going. */
  stopped(): void;
}

const text = (input: Input, key: string) => {
  const value = input[key];
  if (typeof value !== "string" || !value.trim())
    throw new Error(`"${key}" must be a non-empty string.`);
  return value.trim();
};

const describe = (meta: RecordingMeta) => ({
  id: meta.id,
  name: meta.name,
  started: new Date(meta.startedAt).toISOString(),
  ...(meta.endedAt !== undefined && { ended: new Date(meta.endedAt).toISOString() }),
  frames: meta.frameCount,
  files: meta.files,
});

/**
 * What agents do with the recordings. They never ask the user anything: the commands of the
 * extension (`stop`, `rename`, `remove`) open dialogs, which would leave an agent waiting.
 */
export function createTools(
  controller: Controller,
  hooks: ToolHooks,
): Record<string, (input: Input) => unknown> {
  const find = (id: string) => {
    // The recording in progress is in the list only after its first save.
    const meta =
      controller.active.value?.meta.id === id
        ? controller.active.value.meta
        : controller.recordings.value.find((m) => m.id === id);
    if (!meta) throw new Error(`There is no recording "${id}". See list_recordings.`);
    return meta;
  };

  return {
    start_recording() {
      const already = !!controller.active.value;
      if (!already) hooks.start();
      return { recording: true, already, ...describe(controller.active.value!.meta) };
    },

    async stop_recording(input) {
      const name = input.name === undefined ? undefined : text(input, "name");
      hooks.stopped();
      const stopped = await controller.stop();
      if (!stopped) throw new Error("There is no recording in progress.");
      if (name && name !== stopped.name) {
        await controller.rename(stopped.id, name);
        stopped.name = name;
      }
      return { recording: false, ...describe(stopped) };
    },

    list_recordings() {
      const active = controller.active.value;
      return {
        recording: active ? describe(active.meta) : null,
        recordings: controller.recordings.value.map(describe),
      };
    },

    async rename_recording(input) {
      const meta = find(text(input, "id"));
      const name = text(input, "name");
      await controller.rename(meta.id, name);
      return { id: meta.id, name };
    },

    async delete_recording(input) {
      const meta = find(text(input, "id"));
      if (controller.active.value?.meta.id === meta.id) {
        throw new Error("That recording is in progress: stop it first (stop_recording).");
      }
      await controller.remove(meta.id);
      return { deleted: describe(meta) };
    },
  };
}
