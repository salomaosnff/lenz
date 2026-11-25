export type Mode = "flex" | "grid" | "box" | "bug";

export const MODE_LABEL: Record<Mode, string> = {
  flex: "Flexbox",
  grid: "Grid",
  box: "Caixa",
  bug: "Bug",
};

export interface Level {
  id: string;
  mode: Mode;
  title: string;
  /** What the property does, in a couple of sentences. */
  lesson: string;
  /** The task, in one line. */
  goal: string;
  hint: string;
  /** The CSS that solves it: the goal board is drawn with it. */
  solution: string;
  /** Properties the player may use. */
  allowed: string[];
  /** Number of boxes on the board. */
  items: number;
  /** What is typed in the editor at the start. */
  start?: string;
  /** Which box the CSS applies to: the container (default) or one box, by index. */
  target?: "container" | number;
  /** Fixed CSS of the container and of every box, which the player does not write. */
  container?: string;
  item?: string;
}

const FLEX = "display: flex;";
const BOX = "width: 44px; height: 44px;";
const GRID = "display: grid; grid-auto-rows: 50px;";

const flexAxis = ["justify-content", "align-items", "flex-direction", "flex-wrap"];

export const levels: Level[] = [
  {
    id: "flex-justify-end",
    mode: "flex",
    title: "Empurrando para o fim",
    lesson:
      "Em um container `display: flex`, `justify-content` distribui os itens ao longo do eixo principal (a linha). `flex-end` empurra todos para o fim.",
    goal: "Leve os blocos para o lado direito.",
    hint: "Pense no fim da linha: qual valor de `justify-content` empurra os itens para lá?",
    solution: "justify-content: flex-end;",
    allowed: ["justify-content"],
    items: 3,
    container: FLEX,
    item: BOX,
  },
  {
    id: "flex-justify-center",
    mode: "flex",
    title: "Alinhando ao centro",
    lesson: "`center` agrupa os itens no meio do eixo principal.",
    goal: "Centralize os blocos na horizontal.",
    hint: 'Você quer os itens no meio do eixo principal. Qual valor significa "meio"?',
    solution: "justify-content: center;",
    allowed: ["justify-content"],
    items: 3,
    container: FLEX,
    item: BOX,
  },
  {
    id: "flex-space-between",
    mode: "flex",
    title: "Espaço entre os blocos",
    lesson:
      "`space-between` põe o primeiro item no início, o último no fim e reparte o espaço que sobra entre os outros. `space-around` e `space-evenly` fazem variações disso.",
    goal: "Espalhe os blocos de ponta a ponta.",
    hint: "Procure um valor de `justify-content` que reparte o espaço *entre* os itens, deixando o primeiro e o último colados nas pontas.",
    solution: "justify-content: space-between;",
    allowed: ["justify-content"],
    items: 4,
    container: FLEX,
    item: BOX,
  },
  {
    id: "flex-align-center",
    mode: "flex",
    title: "O eixo cruzado",
    lesson:
      "`align-items` alinha os itens no eixo cruzado (na vertical, quando a direção é linha). Valores comuns: `flex-start`, `center`, `flex-end`, `stretch`.",
    goal: "Centralize os blocos na vertical.",
    hint: "Agora é o outro eixo. Qual propriedade alinha na vertical quando a direção é linha?",
    solution: "align-items: center;",
    allowed: flexAxis,
    items: 3,
    container: FLEX,
    item: BOX,
  },
  {
    id: "flex-center-both",
    mode: "flex",
    title: "Centro perfeito",
    lesson:
      "Combinar `justify-content` e `align-items` com `center` coloca o conteúdo bem no meio, nos dois eixos.",
    goal: "Coloque os blocos no centro do quadro.",
    hint: "Você precisa de duas propriedades, uma para cada eixo, e as duas pedem o mesmo valor.",
    solution: "justify-content: center; align-items: center;",
    allowed: flexAxis,
    items: 2,
    container: FLEX,
    item: BOX,
  },
  {
    id: "flex-column",
    mode: "flex",
    title: "Mudando a direção",
    lesson:
      "`flex-direction` troca o eixo principal. Com `column`, os itens ficam um embaixo do outro, e `justify-content` passa a agir na vertical.",
    goal: "Empilhe os blocos e leve-os para o fundo.",
    hint: "Duas coisas mudam: a direção do eixo principal e o lado do eixo para onde os itens vão. Comece pela direção.",
    solution: "flex-direction: column; justify-content: flex-end;",
    allowed: flexAxis,
    items: 3,
    container: FLEX,
    item: BOX,
  },
  {
    id: "flex-row-reverse",
    mode: "flex",
    title: "Invertendo a ordem",
    lesson:
      "`row-reverse` e `column-reverse` invertem a ordem dos itens. Repare que o início do eixo também muda de lado.",
    goal: "Inverta a ordem dos blocos.",
    hint: "A propriedade é a que troca a direção do eixo. Existe um valor que mantém a linha na horizontal, mas ao contrário.",
    solution: "flex-direction: row-reverse;",
    allowed: flexAxis,
    items: 4,
    container: FLEX,
    item: BOX,
  },
  {
    id: "flex-wrap",
    mode: "flex",
    title: "Quebra de linha",
    lesson:
      "Por padrão os itens são espremidos numa linha só. Com `flex-wrap: wrap`, os que não cabem vão para a linha de baixo.",
    goal: "Faça os blocos quebrarem em mais de uma linha.",
    hint: "Os blocos estão espremidos numa linha só. Qual propriedade permite que eles quebrem de linha?",
    solution: "flex-wrap: wrap;",
    allowed: flexAxis,
    items: 6,
    container: `${FLEX} align-content: flex-start;`,
    item: "width: 110px; height: 44px; flex: none;",
  },
  {
    id: "flex-gap",
    mode: "flex",
    title: "Espaçamento",
    lesson: "`gap` cria um espaço fixo entre os itens, sem precisar de margens.",
    goal: "Separe os blocos com 20px de espaço.",
    hint: "Existe uma propriedade só para o espaço entre os itens. O valor é um comprimento.",
    solution: "gap: 20px;",
    allowed: [...flexAxis, "gap"],
    items: 4,
    container: FLEX,
    item: BOX,
  },
  {
    id: "flex-order",
    mode: "flex",
    title: "A ordem dos itens",
    lesson:
      "`order` muda a posição de um item sem mexer no HTML. Todos começam com `0`; quanto maior o número, mais ao fim. Aqui o CSS vale só para o bloco 1.",
    goal: "Mande o bloco 1 para o final da fila.",
    hint: "Todos os itens começam com o mesmo valor nessa propriedade. Para um item ir para o fim, o valor dele precisa ser maior que o dos outros.",
    solution: "order: 1;",
    allowed: ["order"],
    items: 3,
    target: 0,
    container: `${FLEX} gap: 10px;`,
    item: BOX,
  },
  {
    id: "flex-grow",
    mode: "flex",
    title: "Crescendo",
    lesson:
      "`flex-grow` faz um item crescer para ocupar o espaço livre. Com `1`, ele toma tudo o que sobra. O CSS vale só para o bloco 2.",
    goal: "Faça o bloco 2 ocupar o espaço que sobra.",
    hint: "Existe uma propriedade que diz o quanto um item cresce para ocupar o espaço livre. Com `0`, ele não cresce.",
    solution: "flex-grow: 1;",
    allowed: ["flex-grow", "flex"],
    items: 3,
    target: 1,
    container: `${FLEX} gap: 10px;`,
    item: BOX,
  },
  {
    id: "flex-align-self",
    mode: "flex",
    title: "Um item diferente",
    lesson:
      "`align-self` faz um único item ignorar o `align-items` do container e se alinhar sozinho. O CSS vale só para o bloco 2.",
    goal: "Leve só o bloco 2 para o fundo.",
    hint: "É a versão do `align-items` que vale para um item só.",
    solution: "align-self: flex-end;",
    allowed: ["align-self"],
    items: 3,
    target: 1,
    container: `${FLEX} gap: 10px; align-items: flex-start;`,
    item: BOX,
  },
  {
    id: "grid-columns",
    mode: "grid",
    title: "Criando colunas",
    lesson:
      "Com `display: grid`, `grid-template-columns` define as colunas. `1fr` é uma fração do espaço livre: `1fr 1fr 1fr` cria três colunas iguais.",
    goal: "Crie três colunas iguais.",
    hint: "Liste o tamanho de cada coluna, separado por espaços. A unidade `fr` reparte o espaço livre em frações iguais.",
    solution: "grid-template-columns: 1fr 1fr 1fr;",
    allowed: ["grid-template-columns", "grid-template-rows"],
    items: 6,
    container: GRID,
  },
  {
    id: "grid-columns-mixed",
    mode: "grid",
    title: "Colunas de tamanhos diferentes",
    lesson:
      "As colunas podem misturar unidades: `80px 1fr` cria uma coluna fixa e outra que ocupa o resto. Com `2fr 1fr`, uma coluna é o dobro da outra.",
    goal: "Faça duas colunas: uma de 80px e outra que ocupa o resto.",
    hint: "Uma coluna tem tamanho fixo em pixels e a outra pega o que sobra: qual unidade faz isso?",
    solution: "grid-template-columns: 80px 1fr;",
    allowed: ["grid-template-columns", "grid-template-rows"],
    items: 4,
    container: GRID,
  },
  {
    id: "grid-gap",
    mode: "grid",
    title: "Espaço entre as células",
    lesson:
      "No grid, `gap` espaça linhas e colunas ao mesmo tempo. Dá para usar `row-gap` e `column-gap` para valores diferentes.",
    goal: "Faça duas colunas iguais com 16px de espaço entre as células.",
    hint: "São duas coisas: o número de colunas e o espaço entre as células (a mesma propriedade do flexbox).",
    solution: "grid-template-columns: 1fr 1fr; gap: 16px;",
    allowed: ["grid-template-columns", "gap", "row-gap", "column-gap"],
    items: 4,
    container: GRID,
  },
  {
    id: "grid-span",
    mode: "grid",
    title: "Ocupando mais células",
    lesson:
      "Um item pode ocupar mais de uma célula. `grid-column: span 2` faz o item abranger duas colunas. O CSS vale só para o bloco 1.",
    goal: "Faça o bloco 1 ocupar duas colunas.",
    hint: 'Quantas colunas o bloco precisa abranger? Existe uma palavra para "abranger" que vem antes do número.',
    solution: "grid-column: span 2;",
    allowed: ["grid-column", "grid-row"],
    items: 5,
    target: 0,
    container: `${GRID} grid-template-columns: 1fr 1fr 1fr; gap: 8px;`,
  },
  {
    id: "grid-line",
    mode: "grid",
    title: "As linhas do grid",
    lesson:
      "As linhas entre as colunas são numeradas a partir de 1. `grid-column: 2 / 4` vai da linha 2 até a linha 4, ocupando duas colunas a partir da segunda. O CSS vale só para o bloco 1.",
    goal: "Posicione o bloco 1 da segunda à terceira coluna.",
    hint: "As linhas do grid são numeradas a partir de 1 e o valor tem o formato início / fim. Conte as linhas, não as colunas.",
    solution: "grid-column: 2 / 4;",
    allowed: ["grid-column", "grid-row"],
    items: 3,
    target: 0,
    container: `${GRID} grid-template-columns: repeat(3, 1fr); gap: 8px;`,
  },
  {
    id: "grid-place-items",
    mode: "grid",
    title: "Alinhando nas células",
    lesson:
      "`place-items` alinha o conteúdo de cada célula nos dois eixos de uma vez (é o atalho de `align-items` e `justify-items`). Com `center`, cada bloco fica no meio da sua célula.",
    goal: "Centralize cada bloco dentro da sua célula.",
    hint: "Existe um atalho que alinha o conteúdo de cada célula nos dois eixos de uma vez.",
    solution: "place-items: center;",
    allowed: ["place-items", "align-items", "justify-items"],
    items: 4,
    container: `${GRID} grid-template-columns: 1fr 1fr;`,
    item: BOX,
  },
];

export const levelIndex = (id: string) => levels.findIndex((l) => l.id === id);
