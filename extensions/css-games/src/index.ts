import { reactive } from "vue";
import { defineExtension } from "lenz-sdk";
import Arena from "./Arena.vue";
import Cable from "./Cable.vue";
import Hunt from "./Hunt.vue";
import Palette from "./Palette.vue";
import Quiz from "./Quiz.vue";
import LayoutGame from "./LayoutGame.vue";
import Panel from "./Panel.vue";
import { arenaLevels } from "./arena";
import { bugLevels } from "./bugs";
import { cableLevels } from "./cable";
import { houseLevels } from "./house";
import { paletteLevels } from "./palette";
import { questions } from "./quiz";
import { levels } from "./levels";
import { BLOCKS_KEY, BUGS_KEY, HOUSE_KEY } from "./progress";
import { selectorLevels } from "./selectors";
import styles from "./styles.css?inline";

export default defineExtension({
  activate(context) {
    const id = context.extensionId;
    const style = document.createElement("style");
    style.dataset.extension = id;
    style.textContent = styles;
    document.head.append(style);
    context.subscriptions.push({ dispose: () => style.remove() });

    // The games clear their own progress when `resets` changes.
    const signal = reactive({ resets: 0 });

    // Each game is a page: a tab of the main area. They are declared in package.json (`contributes.pages`).
    const openers = {
      colors: () => context.pages.open(`${id}.colors`),
      hunt: () => context.pages.open(`${id}.hunt`),
      house: () => context.pages.open(`${id}.house`),
      cable: () => context.pages.open(`${id}.cable`),
      blocks: () => context.pages.open(`${id}.blocks`),
      bugs: () => context.pages.open(`${id}.bugs`),
      arena: () => context.pages.open(`${id}.arena`),
      quiz: () => context.pages.open(`${id}.quiz`),
    };
    // The games, the easiest first. The panel lists them, and the quiz sends the player to them.
    const games = [
      {
        id: "colors",
        title: "Fábrica de Tintas",
        difficulty: "Iniciante",
        text: `Cores: ${paletteLevels.length} fases de nomes, hexadecimal, rgb, hsl e contraste.`,
        open: openers.colors,
      },
      {
        id: "hunt",
        title: "Tiro ao Alvo",
        difficulty: "Iniciante",
        text: `Seletores CSS: ${selectorLevels.length} fases para mirar nos elementos certos.`,
        open: openers.hunt,
      },
      {
        id: "house",
        title: "Construtor de Caixas",
        difficulty: "Básico",
        text: `Box model: ${houseLevels.length} fases de margin, padding, borda e tamanho.`,
        open: openers.house,
      },
      {
        id: "cable",
        title: "Cabo de Guerra",
        difficulty: "Intermediário",
        text: `Especificidade: ${cableLevels.length} fases para descobrir qual regra vence.`,
        open: openers.cable,
      },
      {
        id: "blocks",
        title: "Dança das Caixas",
        difficulty: "Avançado",
        text: `Flexbox e Grid: ${levels.length} fases para pôr cada bloco no seu lugar.`,
        open: openers.blocks,
      },
      {
        id: "bugs",
        title: "Caça-Bugs",
        difficulty: "Especialista",
        text: `Depuração: ${bugLevels.length} fases para achar e consertar o defeito do CSS.`,
        open: openers.bugs,
      },
      {
        id: "arena",
        title: "Pixel Perfeito",
        difficulty: "Mestre",
        text: `Batalha: ${arenaLevels.length} imagens para recriar só com HTML e CSS.`,
        open: openers.arena,
      },
      {
        id: "quiz",
        title: "Prova de Fogo",
        difficulty: "Todos os níveis",
        text: `Quiz: ${questions.length} perguntas do fácil ao difícil, com nota e dicas do que estudar.`,
        open: openers.quiz,
      },
    ];

    context.subscriptions.push(
      context.pages.registerPageProvider({
        id: `${id}.colors`,
        resolvePage: () => ({ type: "vue-component", component: Palette, props: { signal } }),
      }),
      context.pages.registerPageProvider({
        id: `${id}.hunt`,
        resolvePage: () => ({ type: "vue-component", component: Hunt, props: { signal } }),
      }),
      context.pages.registerPageProvider({
        id: `${id}.house`,
        resolvePage: () => ({
          type: "vue-component",
          component: LayoutGame,
          props: { signal, levels: houseLevels, storageKey: HOUSE_KEY },
        }),
      }),
      context.pages.registerPageProvider({
        id: `${id}.cable`,
        resolvePage: () => ({ type: "vue-component", component: Cable, props: { signal } }),
      }),
      context.pages.registerPageProvider({
        id: `${id}.blocks`,
        resolvePage: () => ({
          type: "vue-component",
          component: LayoutGame,
          props: { signal, levels, storageKey: BLOCKS_KEY },
        }),
      }),
      context.pages.registerPageProvider({
        id: `${id}.bugs`,
        resolvePage: () => ({
          type: "vue-component",
          component: LayoutGame,
          props: { signal, levels: bugLevels, storageKey: BUGS_KEY },
        }),
      }),
      context.pages.registerPageProvider({
        id: `${id}.arena`,
        resolvePage: () => ({ type: "vue-component", component: Arena, props: { signal } }),
      }),
      context.pages.registerPageProvider({
        id: `${id}.quiz`,
        resolvePage: () => ({
          type: "vue-component",
          component: Quiz,
          props: {
            signal,
            games: games.map(({ id: gameId, title }) => ({ id: gameId, title })),
            open: (gameId: string) => openers[gameId as keyof typeof openers]?.(),
          },
        }),
      }),
      // The "Jogos" panel of the activity bar.
      context.views.registerViewProvider({
        viewId: `${id}.games`,
        resolveView: () => ({
          type: "vue-component",
          component: Panel,
          props: { games },
        }),
      }),
    );

    // Declared in package.json (`contributes.commands`); here is what each does.
    const { notifications } = context;
    const commands: Record<string, () => unknown> = {
      openColors: openers.colors,
      openHunt: openers.hunt,
      openHouse: openers.house,
      openCable: openers.cable,
      openBlocks: openers.blocks,
      openBugs: openers.bugs,
      openArena: openers.arena,
      openQuiz: openers.quiz,
      async reset() {
        const answer = await notifications.showWarningMessage(
          "Reiniciar o progresso dos jogos?",
          { modal: true, detail: "As fases resolvidas, em todos os jogos, serão esquecidas." },
          "Reiniciar",
        );
        if (answer !== "Reiniciar") return;
        signal.resets++;
        void notifications.showInformationMessage("Progresso reiniciado.");
      },
    };
    for (const [name, run] of Object.entries(commands)) {
      context.subscriptions.push(context.commands.registerCommand({ id: `${id}.${name}`, run }));
    }
  },
});
