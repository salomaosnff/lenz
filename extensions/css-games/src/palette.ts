import {
  colorHints,
  contrastRatio,
  detectFormat,
  type Format,
  type Hint,
  type Rgba,
} from "./color";

interface Base {
  id: string;
  title: string;
  /** What the level teaches, in a couple of sentences. */
  lesson: string;
  goal: string;
  hint: string;
  /** A colour that solves the level, which "Ver solução" types in. */
  solution: string;
}

/** Write the colour of the swatch. */
export interface MatchLevel extends Base {
  kind: "match";
  /** The colour to reach, any CSS colour. */
  target: string;
  /** How the player has to write it. */
  formats: Format[];
  /** Arrows telling whether each channel needs more or less. `none` for names. */
  feedback: "none" | "rgb" | "hsl";
  /** Whether the transparency is part of the goal. */
  alpha?: boolean;
  /** How far each channel may be (0–255 for rgb, degrees and percent for hsl). */
  tolerance: number;
}

/** Pick a text colour that can be read on a background. */
export interface ContrastLevel extends Base {
  kind: "contrast";
  background: string;
  /** The least contrast ratio that is accepted. */
  min: number;
}

export type PaletteLevel = MatchLevel | ContrastLevel;

export const paletteLevels: PaletteLevel[] = [
  {
    id: "color-named",
    kind: "match",
    title: "Pelo nome",
    lesson:
      "O jeito mais simples de escrever uma cor é pelo nome, em inglês: `red`, `gold`, `black`. O CSS conhece cerca de 140 nomes.",
    goal: "Pinte o quadrado: escreva o nome da cor que você vê.",
    hint: "É o nome em inglês de uma das cores primárias, a que lembra o céu.",
    solution: "blue",
    target: "blue",
    formats: ["named"],
    feedback: "none",
    tolerance: 1,
  },
  {
    id: "color-named-2",
    kind: "match",
    title: "Nomes diferentes",
    lesson:
      "Os nomes vão muito além das cores básicas: `tomato`, `steelblue`, `rebeccapurple`, `papayawhip`... Quando um nome serve, ele deixa o código fácil de ler.",
    goal: "Escreva o nome da cor. Ela lembra um alimento.",
    hint: "O nome é o de um fruto vermelho-alaranjado que costuma ir na salada (em inglês).",
    solution: "tomato",
    target: "tomato",
    formats: ["named"],
    feedback: "none",
    tolerance: 1,
  },
  {
    id: "color-hex",
    kind: "match",
    title: "Hexadecimal",
    lesson:
      "A tela mistura **luz** vermelha, verde e azul. Em `#rrggbb`, cada par de dígitos diz quanta luz de cada uma, de `00` (apagada) a `ff` (no máximo).",
    goal: "Escreva em hexadecimal a cor do quadrado.",
    hint: "Olhe para a cor e pense: quais das três luzes estão acesas?",
    solution: "#ff0000",
    target: "#ff0000",
    formats: ["hex", "hex3"],
    feedback: "rgb",
    tolerance: 2,
  },
  {
    id: "color-hex-mix",
    kind: "match",
    title: "Misturando luzes",
    lesson:
      "As luzes se somam: vermelho + verde = amarelo, verde + azul = ciano, vermelho + azul = magenta, e as três juntas dão branco.",
    goal: "Escreva em hexadecimal a cor do quadrado.",
    hint: "Essa cor é a mistura de duas luzes no máximo. Quais?",
    solution: "#ffff00",
    target: "#ffff00",
    formats: ["hex", "hex3"],
    feedback: "rgb",
    tolerance: 2,
  },
  {
    id: "color-hex-gray",
    kind: "match",
    title: "Tons de cinza",
    lesson:
      "Quando os três canais têm o mesmo valor, a cor é um cinza: quanto maior o valor, mais claro. `#000000` é preto e `#ffffff` é branco.",
    goal: "Escreva em hexadecimal o cinza do quadrado.",
    hint: "O cinza está na metade da escala nos três canais. Lembre que `ff` vale 255 e que, em hexadecimal, cada dígito vai de `0` a `f`.",
    solution: "#808080",
    target: "#808080",
    formats: ["hex", "hex3"],
    feedback: "rgb",
    tolerance: 2,
  },
  {
    id: "color-hex-short",
    kind: "match",
    title: "O atalho de 3 dígitos",
    lesson:
      "Se cada par tem dois dígitos iguais, dá para escrever um só: `#f60` vale o mesmo que `#ff6600`.",
    goal: "Escreva a cor do quadrado usando o atalho de 3 dígitos.",
    hint: "O atalho repete cada dígito. Descubra a cor completa, e depois escreva só um dígito de cada par.",
    solution: "#f60",
    target: "#ff6600",
    formats: ["hex3"],
    feedback: "rgb",
    tolerance: 2,
  },
  {
    id: "color-rgb",
    kind: "match",
    title: "rgb()",
    lesson:
      "`rgb(255, 165, 0)` diz as mesmas coisas que o hexadecimal, só que em números de 0 a 255, na ordem vermelho, verde e azul.",
    goal: "Escreva a cor do quadrado em `rgb()`. As setas mostram, canal por canal, se precisa de mais ou menos.",
    hint: "Use as setas: elas dizem se cada canal precisa de mais ou de menos luz. Ajuste um canal de cada vez.",
    solution: "rgb(255, 165, 0)",
    target: "rgb(255, 165, 0)",
    formats: ["rgb"],
    feedback: "rgb",
    tolerance: 4,
  },
  {
    id: "color-alpha",
    kind: "match",
    title: "Transparência",
    lesson:
      "Um quarto valor, o **alfa**, controla a transparência: `rgb(255 0 0 / 50%)` ou `rgba(255, 0, 0, 0.5)`. 0 é invisível e 1 é opaco. O xadrez por trás mostra o que está vazando.",
    goal: "Escreva a cor, com a transparência, em `rgb()`.",
    hint: "O vermelho é puro. Falta decidir quanto ele deixa passar do fundo: está bem no meio da escala de 0 a 1.",
    solution: "rgb(255 0 0 / 0.5)",
    target: "rgb(255 0 0 / 0.5)",
    formats: ["rgb"],
    feedback: "rgb",
    alpha: true,
    tolerance: 4,
  },
  {
    id: "color-hsl",
    kind: "match",
    title: "hsl()",
    lesson:
      "`hsl()` descreve a cor como a gente pensa: **matiz** (a posição no círculo de cores, de 0 a 360 graus), **saturação** (a intensidade) e **luminosidade** (a claridade). `hsl(0, 100%, 50%)` é vermelho.",
    goal: "Escreva a cor do quadrado em `hsl()`.",
    hint: "O matiz anda pelo círculo: 0° é vermelho e 120° é verde. Para onde fica o azul?",
    solution: "hsl(240, 100%, 50%)",
    target: "hsl(240, 100%, 50%)",
    formats: ["hsl"],
    feedback: "hsl",
    tolerance: 5,
  },
  {
    id: "color-hsl-dark",
    kind: "match",
    title: "Claro e escuro",
    lesson:
      'Com 50% de luminosidade a cor é a "pura". Abaixo disso ela escurece (0% é preto) e acima ela clareia (100% é branco).',
    goal: "Escreva em `hsl()` essa cor escura e viva.",
    hint: "Ajuste um valor de cada vez olhando as setas: primeiro o matiz, depois a luminosidade.",
    solution: "hsl(200, 80%, 25%)",
    target: "hsl(200, 80%, 25%)",
    formats: ["hsl"],
    feedback: "hsl",
    tolerance: 5,
  },
  {
    id: "color-hsl-pastel",
    kind: "match",
    title: "Tons pastel",
    lesson:
      "Cores pastel são claras e suaves: luminosidade alta e saturação média. Para apagar uma cor sem escurecê-la, abaixe a saturação.",
    goal: "Escreva em `hsl()` esse tom pastel.",
    hint: "Siga as setas, e lembre que pastel quer luminosidade alta.",
    solution: "hsl(330, 70%, 85%)",
    target: "hsl(330, 70%, 85%)",
    formats: ["hsl"],
    feedback: "hsl",
    tolerance: 5,
  },
  {
    id: "color-contrast-dark",
    kind: "contrast",
    title: "Texto legível",
    lesson:
      "**Contraste** é a diferença de claridade entre o texto e o fundo. A WCAG, o padrão de acessibilidade, pede razão mínima de 4.5:1 para texto normal (nível AA) e 7:1 para o nível mais exigente (AAA).",
    goal: "Escolha uma cor de texto com pelo menos 4.5:1 de contraste.",
    hint: "Fundo escuro pede texto claro.",
    solution: "white",
    background: "#1a237e",
    min: 4.5,
  },
  {
    id: "color-contrast-light",
    kind: "contrast",
    title: "Contraste máximo",
    lesson:
      "A razão vai de 1:1 (a mesma cor) até 21:1 (preto sobre branco). Texto pequeno e pessoas com baixa visão pedem o máximo que der.",
    goal: "Escolha uma cor de texto com pelo menos 7:1 de contraste.",
    hint: "Fundo claro pede texto escuro, e 7:1 é bem exigente: quanto mais extremo, melhor.",
    solution: "black",
    background: "#ffeb3b",
    min: 7,
  },
  {
    id: "color-contrast-gray",
    kind: "contrast",
    title: "O cinza do meio",
    lesson:
      "O cinza do meio é o pior caso: nem o texto claro nem o escuro passam com folga. Aqui só um dos extremos chega ao mínimo, e só testando para saber.",
    goal: "Escolha uma cor de texto com pelo menos 4.5:1 de contraste.",
    hint: "Teste as duas pontas, preto e branco, e olhe a razão. Só uma passa.",
    solution: "black",
    background: "#777777",
    min: 4.5,
  },
];

/** What is not a colour but would be accepted as one: it takes the colour of whatever is around. */
const KEYWORDS = /^(inherit|initial|unset|revert|revert-layer|currentcolor)$/i;
export const MAX_COLOR = 60;

export interface Evaluation {
  /** `empty`: nothing typed. `invalid`: the browser does not know it. `format`: the wrong way to write it. */
  status: "empty" | "invalid" | "format" | "ok";
  player?: Rgba;
  /** The match levels: whether each channel is right, and the way to go if not. */
  hints: Hint[];
  /** The contrast levels: the ratio reached. */
  ratio?: number;
  solved: boolean;
}

/** Turns a CSS colour into its rgba, or `undefined` when it is not a colour. The browser does it. */
export type Resolve = (css: string) => Rgba | undefined;

export function evaluate(level: PaletteLevel, text: string, resolve: Resolve): Evaluation {
  const value = text.trim();
  const none = (status: Evaluation["status"]): Evaluation => ({
    status,
    hints: [],
    solved: false,
  });
  if (!value) return none("empty");
  if (value.length > MAX_COLOR || KEYWORDS.test(value)) return none("invalid");
  const player = resolve(value);
  if (!player) return none("invalid");

  if (level.kind === "contrast") {
    const background = resolve(level.background);
    if (!background) return none("invalid");
    // Text with transparency is read over the background, as it would be on screen.
    const ratio = contrastRatio(player, background);
    return { status: "ok", player, hints: [], ratio, solved: ratio >= level.min };
  }

  const format = detectFormat(value);
  if (!level.formats.includes(format)) return { ...none("format"), player };
  const target = resolve(level.target);
  if (!target) return { ...none("invalid"), player };
  if (level.feedback === "none") {
    const close = ["r", "g", "b"].every(
      (k) => Math.abs(player[k as "r"] - target[k as "r"]) <= level.tolerance,
    );
    return { status: "ok", player, hints: [], solved: close };
  }
  const hints = colorHints(player, target, level.feedback, !!level.alpha, level.tolerance);
  return { status: "ok", player, hints, solved: hints.every((h) => h.state === "ok") };
}
