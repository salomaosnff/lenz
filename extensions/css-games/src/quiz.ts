export type Difficulty = 1 | 2 | 3;

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  1: "Fácil",
  2: "Médio",
  3: "Difícil",
};
/** What a right answer is worth: a hard question counts for more in the grade. */
export const WEIGHT: Record<Difficulty, number> = { 1: 1, 2: 2, 3: 3 };

export interface Topic {
  id: string;
  label: string;
  /** What to go over when this topic goes badly. */
  study: string;
  /** The game of this extension that practices it, if there is one. */
  game?: string;
}

export const topics: Topic[] = [
  {
    id: "basics",
    label: "Fundamentos",
    study:
      "Revise a sintaxe `seletor { propriedade: valor; }`, os comentários e como ligar o CSS ao HTML.",
  },
  {
    id: "selectors",
    label: "Seletores",
    study:
      "Revise os seletores de tag, classe, id e atributo, os combinadores (espaço, `>`, `+`) e as pseudoclasses como `:first-child`, `:nth-child()` e `:not()`.",
    game: "hunt",
  },
  {
    id: "cascade",
    label: "Especificidade e cascata",
    study:
      "Estude como o navegador escolhe a regra que vence: o peso do seletor (id, depois classe, depois tag), a ordem das regras, a herança, o estilo inline e o `!important`.",
    game: "cable",
  },
  {
    id: "boxmodel",
    label: "Box model",
    study:
      "Reveja as camadas da caixa: conteúdo, `padding`, borda e `margin`. Treine a conta da largura total e o efeito do `box-sizing`.",
    game: "house",
  },
  {
    id: "colors",
    label: "Cores",
    study:
      "Pratique os formatos de cor (nome, hexadecimal, `rgb()`, `hsl()`), a transparência e o contraste entre o texto e o fundo.",
    game: "colors",
  },
  {
    id: "text",
    label: "Tipografia",
    study:
      "Revise `font-family`, `font-size`, `font-weight`, `line-height` e `text-align`, e a diferença entre `px`, `em` e `rem`.",
  },
  {
    id: "flex",
    label: "Flexbox",
    study:
      "Reveja os dois eixos do flexbox: `flex-direction`, `justify-content` (principal) e `align-items` (cruzado), mais `flex-wrap`, `gap` e `flex-grow` nos itens.",
    game: "blocks",
  },
  {
    id: "grid",
    label: "Grid",
    study:
      "Estude `grid-template-columns`, a unidade `fr`, `gap`, `grid-column` e as linhas numeradas do grid.",
    game: "blocks",
  },
  {
    id: "position",
    label: "Posicionamento e display",
    study:
      "Entenda `position` (`static`, `relative`, `absolute`, `fixed`, `sticky`), qual elemento serve de referência para o `absolute`, o `z-index` e as diferenças entre os valores de `display`.",
  },
  {
    id: "responsive",
    label: "Layout responsivo",
    study:
      "Veja as `@media queries`, a meta tag `viewport`, e as unidades relativas (`%`, `vw`, `rem`) que deixam a página se adaptar.",
  },
];

export interface Question {
  id: string;
  topic: string;
  level: Difficulty;
  /** The question. Text between backticks is shown as code. */
  text: string;
  /** A snippet to read before answering. */
  code?: string;
  correct: string;
  /** Three wrong answers. The order of all four is shuffled each time the quiz is played. */
  wrong: [string, string, string];
  /** Shown after the answer: why. */
  explain: string;
}

export const questions: Question[] = [
  // ---- Easy -----------------------------------------------------------------------------------
  {
    id: "q-class",
    topic: "selectors",
    level: 1,
    text: 'Qual seletor pega todos os elementos com `class="aviso"`?',
    correct: ".aviso",
    wrong: ["#aviso", "aviso", "*aviso"],
    explain: "Classes usam um ponto na frente. O `#` é para o `id`.",
  },
  {
    id: "q-id",
    topic: "selectors",
    level: 1,
    text: 'Qual seletor pega o elemento com `id="topo"`?',
    correct: "#topo",
    wrong: [".topo", "topo", "@topo"],
    explain: "O id usa `#`. Como ele é único na página, o seletor pega um elemento só.",
  },
  {
    id: "q-comment",
    topic: "basics",
    level: 1,
    text: "Como se escreve um comentário em CSS?",
    correct: "/* comentário */",
    wrong: ["// comentário", "-- comentário --", "# comentário"],
    explain: "Em CSS só existe o comentário entre `/*` e `*/`. O `//` não funciona.",
  },
  {
    id: "q-syntax",
    topic: "basics",
    level: 1,
    text: "Qual é a forma correta de escrever uma regra de CSS?",
    correct: "p { color: red; }",
    wrong: ["p ( color = red )", "p { color -> red }", '<p color="red">'],
    explain: "Seletor, chaves, e dentro delas `propriedade: valor;`.",
  },
  {
    id: "q-color-prop",
    topic: "colors",
    level: 1,
    text: "Qual propriedade muda a cor do texto?",
    correct: "color",
    wrong: ["text-color", "font-color", "foreground"],
    explain: "`color` é a cor do texto. A cor de fundo é `background-color`.",
  },
  {
    id: "q-hex",
    topic: "colors",
    level: 1,
    text: "Qual destas é uma cor hexadecimal válida?",
    correct: "#ff8800",
    wrong: ["#gg0000", "ff8800", "#12345"],
    explain:
      "O hexadecimal começa com `#` e só usa os dígitos de `0` a `9` e as letras de `a` a `f`, em 3 ou 6 dígitos (ou 4 e 8, com transparência).",
  },
  {
    id: "q-padding",
    topic: "boxmodel",
    level: 1,
    text: "Qual propriedade cria espaço DENTRO da caixa, entre o conteúdo e a borda?",
    correct: "padding",
    wrong: ["margin", "gap", "spacing"],
    explain: "`padding` é o espaço interno. A `margin` é o espaço de fora.",
  },
  {
    id: "q-margin",
    topic: "boxmodel",
    level: 1,
    text: "Qual propriedade cria espaço FORA da caixa, afastando-a dos elementos vizinhos?",
    correct: "margin",
    wrong: ["padding", "border", "outline"],
    explain: "A `margin` fica depois da borda e afasta a caixa dos elementos ao redor.",
  },
  {
    id: "q-bold",
    topic: "text",
    level: 1,
    text: "Qual propriedade deixa o texto em negrito?",
    correct: "font-weight",
    wrong: ["font-style", "text-bold", "text-weight"],
    explain: "`font-weight: bold` (ou `700`). O `font-style` é para itálico.",
  },
  {
    id: "q-align",
    topic: "text",
    level: 1,
    text: "Como se centraliza o texto dentro de um bloco?",
    correct: "text-align: center;",
    wrong: ["align: center;", "font-align: center;", "text-center: true;"],
    explain: "`text-align` controla o alinhamento horizontal do texto.",
  },
  {
    id: "q-flex",
    topic: "flex",
    level: 1,
    text: "O que `display: flex` faz com os filhos diretos do elemento?",
    correct: "Coloca-os lado a lado, numa linha, e libera propriedades como `justify-content`",
    wrong: ["Esconde os filhos", "Deixa os filhos em negrito", "Cria uma grade fixa de 12 colunas"],
    explain:
      "Ele transforma o elemento num container flexível: os filhos viram itens, em linha por padrão.",
  },
  // ---- Medium ---------------------------------------------------------------------------------
  {
    id: "q-cascade-weight",
    topic: "cascade",
    level: 2,
    text: "Um `<p>` está dentro de um elemento com a classe `card`, e o CSS tem as regras abaixo. De que cor fica o texto do parágrafo?",
    code: ".card p { color: red; }\np { color: blue; }",
    correct: "Vermelho",
    wrong: ["Azul", "Roxo, a mistura das duas", "Depende do navegador"],
    explain:
      "`.card p` tem uma classe e uma tag, e `p` só uma tag. O seletor mais específico vence, mesmo vindo antes.",
  },
  {
    id: "q-cascade-tie",
    topic: "cascade",
    level: 2,
    text: "Duas regras com a mesma especificidade disputam o mesmo elemento. Qual vence?",
    correct: "A que aparece por último no CSS",
    wrong: [
      "A que aparece primeiro",
      "A que tem mais propriedades",
      "A que tem o seletor mais curto",
    ],
    explain: "No empate, vale a ordem: a regra escrita depois sobrescreve a anterior.",
  },
  {
    id: "q-child",
    topic: "selectors",
    level: 2,
    text: "O que o seletor `ul > li` pega?",
    correct: "Os `li` que são filhos diretos de um `ul`",
    wrong: [
      "Todos os `li` dentro de um `ul`, em qualquer nível",
      "Os `ul` que estão dentro de um `li`",
      "O `li` que vem logo depois de cada `ul`",
    ],
    explain:
      "O `>` exige parentesco direto: o `li` precisa estar logo dentro do `ul`, sem nenhum outro elemento no meio.",
  },
  {
    id: "q-box-width",
    topic: "boxmodel",
    level: 2,
    text: "Um bloco tem o CSS abaixo, sem mudar o `box-sizing`. Quanto de largura ele ocupa no total?",
    code: "width: 100px;\npadding: 10px;\nborder: 5px solid;",
    correct: "130px",
    wrong: ["100px", "115px", "120px"],
    explain:
      "No `content-box`, a largura soma o padding e a borda dos dois lados: 100 + 20 + 10 = 130px.",
  },
  {
    id: "q-border-box",
    topic: "boxmodel",
    level: 2,
    text: "O que muda com `box-sizing: border-box`?",
    correct: "`width` e `height` passam a incluir o padding e a borda",
    wrong: [
      "A borda some do elemento",
      "A margem passa a ser contada dentro da caixa",
      "O elemento fica com cantos arredondados",
    ],
    explain:
      "Com `border-box`, o tamanho que você escreve é o tamanho final da caixa. Fica bem mais fácil de calcular.",
  },
  {
    id: "q-justify",
    topic: "flex",
    level: 2,
    text: "Num container flex em linha, qual propriedade distribui os itens ao longo da linha (o eixo principal)?",
    correct: "justify-content",
    wrong: ["align-items", "flex-align", "vertical-align"],
    explain: "`justify-content` age no eixo principal e `align-items` no cruzado.",
  },
  {
    id: "q-grid-fr",
    topic: "grid",
    level: 2,
    text: "O que `grid-template-columns: 1fr 1fr 1fr` cria?",
    correct: "Três colunas de largura igual, dividindo o espaço livre",
    wrong: ["Três linhas de 1px", "Uma coluna com três itens", "Três colunas de 1 pixel cada"],
    explain: "`fr` é uma fração do espaço livre: três `1fr` dão três colunas iguais.",
  },
  {
    id: "q-position-default",
    topic: "position",
    level: 2,
    text: "Qual é o valor padrão da propriedade `position`?",
    correct: "static",
    wrong: ["relative", "absolute", "fixed"],
    explain:
      "Elementos `static` seguem o fluxo normal e ignoram `top`, `left`, `right` e `bottom`.",
  },
  {
    id: "q-alpha",
    topic: "colors",
    level: 2,
    text: "O que controla o quarto valor de `rgba(255, 0, 0, 0.5)`?",
    correct: "A transparência (alfa)",
    wrong: ["O brilho", "A saturação", "O contraste"],
    explain: "O alfa vai de 0 (invisível) a 1 (opaco). Com `0.5`, a cor fica meio transparente.",
  },
  {
    id: "q-media",
    topic: "responsive",
    level: 2,
    text: "Qual regra aplica estilos só em telas de até 600px de largura?",
    correct: "@media (max-width: 600px) { ... }",
    wrong: [
      "@media (min-width: 600px) { ... }",
      "@screen < 600px { ... }",
      "@responsive(600px) { ... }",
    ],
    explain:
      "`max-width` vale até aquela largura. O `min-width` é o contrário: de 600px para cima.",
  },
  {
    id: "q-viewport",
    topic: "responsive",
    level: 2,
    text: "Qual tag no `<head>` é necessária para o layout responsivo funcionar bem em celulares?",
    correct: '<meta name="viewport" content="width=device-width, initial-scale=1">',
    wrong: [
      '<meta name="responsive" content="true">',
      '<link rel="mobile" href="mobile.css">',
      '<meta charset="mobile">',
    ],
    explain: "Sem a meta `viewport`, o celular finge ter uma tela larga e reduz a página toda.",
  },
  // ---- Hard -----------------------------------------------------------------------------------
  {
    id: "q-weight",
    topic: "cascade",
    level: 3,
    text: "Qual destes seletores tem a MAIOR especificidade?",
    correct: "#menu",
    wrong: ["ul li a", ".menu .item", "a:hover"],
    explain:
      "Um id (1,0,0) pesa mais que qualquer número de classes ou tags. `.menu .item` é (0,2,0), `a:hover` é (0,1,1) e `ul li a` é (0,0,3).",
  },
  {
    id: "q-important",
    topic: "cascade",
    level: 3,
    text: 'Um parágrafo tem `style="color: green"` no HTML e o CSS tem a regra abaixo. De que cor fica?',
    code: "p { color: blue !important; }",
    correct: "Azul",
    wrong: ["Verde", "Fica sem cor", "Depende de qual veio primeiro"],
    explain: "O `!important` vence até o estilo inline.",
  },
  {
    id: "q-nth",
    topic: "selectors",
    level: 3,
    text: "O que `li:nth-child(odd)` seleciona?",
    correct: "Os `li` em posição ímpar: 1º, 3º, 5º...",
    wrong: [
      "Só o `li` de número 0",
      "Os `li` em posição par: 2º, 4º, 6º...",
      "Todos os `li` menos o primeiro",
    ],
    explain: "`odd` são os ímpares e `even` os pares. Também dá para usar fórmulas, como `3n`.",
  },
  {
    id: "q-not",
    topic: "selectors",
    level: 3,
    text: "Qual seletor pega os links que NÃO têm a classe `ativo`?",
    correct: "a:not(.ativo)",
    wrong: ["a:!ativo", "a.not(ativo)", "a ! .ativo"],
    explain: "`:not()` recebe, entre parênteses, o seletor do que deve ficar de fora.",
  },
  {
    id: "q-absolute",
    topic: "position",
    level: 3,
    text: "Um elemento com `position: absolute` se posiciona em relação a quê?",
    correct: "Ao ancestral mais próximo que tenha `position` diferente de `static`",
    wrong: [
      "Sempre à janela do navegador",
      "Ao elemento irmão que vem antes dele",
      "Sempre ao elemento `body`",
    ],
    explain:
      "Por isso é comum pôr `position: relative` no pai: ele vira a referência do filho absoluto.",
  },
  {
    id: "q-none-hidden",
    topic: "position",
    level: 3,
    text: "Qual é a diferença entre `display: none` e `visibility: hidden`?",
    correct: "`none` remove o elemento do layout; `hidden` o esconde mas mantém o espaço",
    wrong: [
      "Não há diferença nenhuma",
      "`hidden` remove o elemento do layout; `none` mantém o espaço",
      "`none` só vale para texto",
    ],
    explain:
      "Com `display: none` os vizinhos ocupam o lugar do elemento. Com `visibility: hidden`, o buraco fica.",
  },
  {
    id: "q-flex-grow",
    topic: "flex",
    level: 3,
    text: "Em `flex: 1 1 0%`, o que faz o primeiro `1` (o `flex-grow`)?",
    correct: "Deixa o item crescer para ocupar o espaço livre do container",
    wrong: [
      "Limita o item a 1 pixel de largura",
      "Define que o item é o primeiro da fila",
      "Impede que o item encolha",
    ],
    explain:
      "O `flex-grow` reparte o espaço que sobrou entre os itens. O segundo valor é o `flex-shrink` e o terceiro o `flex-basis`.",
  },
  {
    id: "q-grid-line",
    topic: "grid",
    level: 3,
    text: "O que `grid-column: 2 / 4` faz num item do grid?",
    correct: "Vai da linha 2 até a linha 4, ocupando duas colunas",
    wrong: [
      "Ocupa 2 colunas, a partir da coluna 4",
      "Ocupa da coluna 2 até a coluna 4, incluindo as duas",
      "Divide a coluna em 2 partes de 4px",
    ],
    explain:
      "As linhas do grid são numeradas a partir de 1. O item começa na linha 2 e termina na 4, então cobre duas colunas.",
  },
  {
    id: "q-rem",
    topic: "text",
    level: 3,
    text: "Com a fonte padrão do navegador (16px), quantos pixels vale `font-size: 1.5rem`?",
    correct: "24px",
    wrong: ["16px", "21px", "1.5px"],
    explain: "`rem` é relativa à fonte do elemento raiz: 1.5 × 16 = 24px.",
  },
  {
    id: "q-collapse",
    topic: "boxmodel",
    level: 3,
    text: "Dois blocos empilhados, no fluxo normal da página: o de cima com `margin-bottom: 20px` e o de baixo com `margin-top: 30px`. Qual é o espaço entre eles?",
    correct: "30px",
    wrong: ["50px", "20px", "10px"],
    explain: "As margens verticais que se tocam colapsam: vale a maior, não a soma.",
  },
];

// ---- Playing ---------------------------------------------------------------------------------------

/** A shuffled copy (Fisher–Yates). `random` is injected so a test can control it. */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

/** The questions from the easiest to the hardest. Inside a level the order is drawn each time. */
export function ordered(random: () => number = Math.random): Question[] {
  return ([1, 2, 3] as const).flatMap((level) =>
    shuffle(
      questions.filter((q) => q.level === level),
      random,
    ),
  );
}

/** The four answers of a question, shuffled. `correct` says which one is right. */
export function choicesOf(question: Question, random: () => number = Math.random) {
  return shuffle(
    [
      { text: question.correct, correct: true },
      ...question.wrong.map((text) => ({ text, correct: false })),
    ],
    random,
  );
}

// ---- The grade -----------------------------------------------------------------------------------

export interface Answer {
  id: string;
  ok: boolean;
}

export interface Share {
  correct: number;
  total: number;
  /** 0 to 1. */
  ratio: number;
}

export interface Grade {
  /** 0 to 10, one decimal. A hard question is worth more than an easy one. */
  score: number;
  correct: number;
  total: number;
  byLevel: (Share & { level: Difficulty })[];
  /** From the weakest topic to the strongest. Only the topics that had questions. */
  byTopic: (Share & { topic: Topic })[];
  /** The topics under `WEAK_BELOW`, weakest first: what to study. */
  weak: (Share & { topic: Topic })[];
  wrong: Question[];
}

/** A topic under this share of right answers goes on the list of what to study. */
export const WEAK_BELOW = 0.7;

const share = (correct: number, total: number): Share => ({
  correct,
  total,
  ratio: total ? correct / total : 0,
});

export function grade(answers: readonly Answer[]): Grade {
  const byId = new Map(questions.map((q) => [q.id, q]));
  const given = answers.flatMap((a) => {
    const question = byId.get(a.id);
    return question ? [{ question, ok: a.ok }] : [];
  });

  let earned = 0;
  let possible = 0;
  for (const { question, ok } of given) {
    possible += WEIGHT[question.level];
    if (ok) earned += WEIGHT[question.level];
  }

  const count = (filter: (q: Question) => boolean) => {
    const these = given.filter((g) => filter(g.question));
    return share(these.filter((g) => g.ok).length, these.length);
  };

  const byTopic = topics
    .map((topic) => ({ topic, ...count((q) => q.topic === topic.id) }))
    .filter((t) => t.total > 0)
    // The weakest first; on a tie, the one with more questions, so it is the surer sign.
    .sort((a, b) => a.ratio - b.ratio || b.total - a.total);

  return {
    score: possible ? Math.round((earned / possible) * 100) / 10 : 0,
    correct: given.filter((g) => g.ok).length,
    total: given.length,
    byLevel: ([1, 2, 3] as const).map((level) => ({ level, ...count((q) => q.level === level) })),
    byTopic,
    weak: byTopic.filter((t) => t.ratio < WEAK_BELOW),
    wrong: given.filter((g) => !g.ok).map((g) => g.question),
  };
}

export function verdict(score: number): { title: string; text: string } {
  if (score >= 9)
    return {
      title: "Mestre do CSS",
      text: "Você domina o que mais se usa no dia a dia. Falta só polir os detalhes.",
    };
  if (score >= 7)
    return {
      title: "Muito bom",
      text: "Uma base sólida. Com um pouco de revisão nos pontos fracos, você chega lá.",
    };
  if (score >= 5)
    return {
      title: "Está no caminho",
      text: "Você já entende o essencial, mas ainda tropeça em alguns conceitos importantes.",
    };
  if (score >= 3)
    return {
      title: "Boa base, falta prática",
      text: "Os fundamentos estão aí. Pratique mais, que o resto vem com o uso.",
    };
  return {
    title: "Hora de revisar o básico",
    text: "Sem pressa: comece pelos fundamentos e avance um tópico de cada vez.",
  };
}

// ---- The last result, kept between visits ---------------------------------------------------------

export interface Saved {
  score: number;
  correct: number;
  total: number;
  /** The best grade so far. */
  best: number;
  /** When it was played (ms since the epoch). */
  at: number;
}

/** Reads what was stored, which may be anything: `undefined` if it is not a saved result. */
export function parseSaved(raw: unknown): Saved | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  const numbers = ["score", "correct", "total", "best", "at"].every(
    (k) => typeof r[k] === "number" && Number.isFinite(r[k]),
  );
  return numbers ? (raw as Saved) : undefined;
}
