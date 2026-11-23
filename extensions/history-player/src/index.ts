import { watchEffect } from "vue";
import { defineExtension } from "lenz-sdk";
import { Controller } from "./controller";
import Panel from "./Panel.vue";
import Player from "./Player.vue";
import { Player as PlayerState } from "./player";
import { Recorder } from "./recorder";
import { InvalidRecordingError } from "./recording";
import { defaultStore } from "./storage";
import styles from "./styles.css?inline";

/** Context key that is true while a recording is in progress. */
const RECORDING = "history-player.recording";

/** Asks the user for a file and gives back its text. `undefined` if they gave up. */
function pickFile(): Promise<string | undefined> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.onchange = () => resolve(input.files?.[0]?.text());
    input.oncancel = () => resolve(undefined);
    input.click();
  });
}

/** Offers a text as a file to save. */
function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default defineExtension({
  activate(context) {
    const id = context.extensionId;
    const style = document.createElement("style");
    style.dataset.extension = id;
    style.textContent = styles;
    document.head.append(style);
    context.subscriptions.push({ dispose: () => style.remove() });

    // ---- Recording and saving -----------------------------------------------------------------
    const controller = new Controller(defaultStore(), context.history);
    controller
      .init()
      .catch((error) => console.error("[lenz] the recordings could not be read", error));
    // A recording in progress is closed and saved when the extension goes.
    context.subscriptions.push({ dispose: () => void controller.stop() });

    const stop = watchEffect(() => context.contextKeys.set(RECORDING, !!controller.active.value));
    context.subscriptions.push({ dispose: stop });

    // ---- Playing -------------------------------------------------------------------------------
    const player = new PlayerState(new Recorder());
    context.subscriptions.push({ dispose: () => player.pause() });
    const playerWindow = context.windows.createWindow({
      id: "player",
      title: "Reprodutor de histórico",
      content: { type: "vue-component", component: Player, props: { player } },
      x: 360,
      y: 90,
      width: 680,
      height: 580,
      open: false,
    });
    context.subscriptions.push(
      playerWindow,
      playerWindow.onDidClose(() => player.pause()),
    );

    const { notifications, prompts } = context;

    let instruction: AbortController | undefined;
    context.subscriptions.push({ dispose: () => instruction?.abort() });

    const actions = {
      start() {
        if (controller.active.value) return;
        controller.start();
        // The instruction is only true while recording: it goes away when the recording stops.
        instruction = new AbortController();
        void notifications.showInformationMessage(
          "Gravação iniciada. Edite seus arquivos e pare quando quiser.",
          {
            signal: instruction.signal,
          },
        );
      },
      async stop() {
        instruction?.abort();
        const stopped = await controller.stop();
        if (!stopped) return;
        // Gives up on the question and the recording keeps its own name: it is already saved.
        const name = await prompts.showInputBox({
          title: "Salvar a gravação",
          prompt: "Nome da gravação",
          value: stopped.name,
          validateInput: (value) => (value.trim() ? undefined : "Informe um nome"),
        });
        const meta = { ...stopped };
        if (name?.trim() && name.trim() !== stopped.name) {
          meta.name = name.trim();
          await controller.rename(stopped.id, meta.name);
        }
        const answer = await notifications.showInformationMessage(
          `Gravação salva: ${meta.name} (${meta.frameCount} ${meta.frameCount === 1 ? "quadro" : "quadros"}).`,
          "Reproduzir",
          "Baixar",
        );
        if (answer === "Reproduzir") await actions.play(meta.id);
        else if (answer === "Baixar") await actions.download(meta.id);
      },
      async play(recordingId: string) {
        const opened = await controller.open(recordingId);
        if (!opened) {
          void notifications.showErrorMessage("Não foi possível abrir a gravação.");
          return;
        }
        player.use(
          opened.recorder,
          opened.meta.name,
          controller.active.value?.meta.id === recordingId,
        );
        playerWindow.open();
      },
      async download(recordingId: string) {
        const file = await controller.exportFile(recordingId);
        if (!file)
          return void notifications.showErrorMessage("Não foi possível baixar a gravação.");
        download(file.name, file.text);
        void notifications.showInformationMessage(`Gravação baixada: ${file.name}`);
      },
      async rename(recordingId: string) {
        const current = controller.recordings.value.find((m) => m.id === recordingId);
        const name = await prompts.showInputBox({
          title: "Renomear a gravação",
          prompt: "Nome da gravação",
          value: current?.name,
          validateInput: (value) => (value.trim() ? undefined : "Informe um nome"),
        });
        if (name?.trim() && name.trim() !== current?.name)
          await controller.rename(recordingId, name.trim());
      },
      async remove(recordingId: string) {
        const meta = controller.recordings.value.find((m) => m.id === recordingId);
        const answer = await notifications.showWarningMessage(
          `Excluir "${meta?.name ?? "a gravação"}"?`,
          { modal: true, detail: "A gravação será apagada e não poderá ser recuperada." },
          "Excluir",
        );
        if (answer !== "Excluir") return;
        await controller.remove(recordingId);
        void notifications.showInformationMessage("Gravação excluída.");
      },
      async load() {
        const text = await pickFile();
        if (text === undefined) return;
        try {
          const meta = await controller.importFile(text);
          void notifications.showInformationMessage(`Gravação carregada: ${meta.name}`);
          await actions.play(meta.id);
        } catch (error) {
          void notifications.showErrorMessage(
            error instanceof InvalidRecordingError
              ? error.message
              : "Não foi possível carregar o arquivo.",
          );
        }
      },
    };

    // ---- The panel in the activity bar ---------------------------------------------------------
    // The panel and its view are declared in package.json; this gives the view its content.
    context.subscriptions.push(
      context.views.registerViewProvider({
        viewId: `${id}.recordings`,
        resolveView: () => ({
          type: "vue-component",
          component: Panel,
          props: { controller, actions },
        }),
      }),
    );

    // ---- Commands ---------------------------------------------------------------------------------
    // Their titles, icons, `when` and shortcuts are declared in package.json; here is what each does.
    // One key (Ctrl+Alt+R) starts and stops: only one of the two commands is available at a time.
    const commands: Record<string, () => unknown> = {
      start: () => actions.start(),
      stop: () => actions.stop(),
      open: () => playerWindow.open(),
      toggle: () => {
        playerWindow.open();
        player.toggle();
      },
      load: () => actions.load(),
    };
    for (const [name, run] of Object.entries(commands)) {
      context.subscriptions.push(context.commands.registerCommand({ id: `${id}.${name}`, run }));
    }
  },
});
