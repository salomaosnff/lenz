import type { Level } from "./levels";

const PADDING = ["padding", "padding-top", "padding-right", "padding-bottom", "padding-left"];
const MARGIN = ["margin", "margin-top", "margin-right", "margin-bottom", "margin-left"];

/** The container: `flow-root` keeps the margins of the boxes from merging with its own edge. */
const CONTAINER = "display: flow-root;";
/** Every box starts as a plain one, with the width and height counting only the content. */
const BOX = "box-sizing: content-box; width: 100px; height: 30px; line-height: 30px;";

/** The levels of Construtor de Caixas, the box model game, from padding to the whole house. */
export const houseLevels: Level[] = [
  {
    id: "house-padding",
    mode: "box",
    title: "Espaço por dentro",
    lesson:
      "Toda caixa tem camadas: o conteúdo, o `padding` (espaço entre o conteúdo e a borda), a borda e a `margin` (espaço por fora). No quadro, o conteúdo é laranja e o padding é a faixa clara em volta dele.",
    goal: "Dê 20px de espaço interno ao bloco 1.",
    hint: "Existe uma propriedade para o espaço entre o conteúdo e a borda. O valor é um comprimento.",
    solution: "padding: 20px;",
    allowed: PADDING,
    items: 2,
    target: 0,
    container: CONTAINER,
    item: BOX,
  },
  {
    id: "house-padding-two",
    mode: "box",
    title: "Cima e lados",
    lesson:
      "Com dois valores, `padding` usa o primeiro para cima e para baixo e o segundo para esquerda e direita. Com quatro, a ordem é cima, direita, baixo, esquerda (sentido horário).",
    goal: "Dê 10px de padding em cima e embaixo e 30px nas laterais do bloco 1.",
    hint: "Escreva dois valores na mesma propriedade: o primeiro vale para o eixo vertical e o segundo para o horizontal.",
    solution: "padding: 10px 30px;",
    allowed: PADDING,
    items: 2,
    target: 0,
    container: CONTAINER,
    item: BOX,
  },
  {
    id: "house-padding-side",
    mode: "box",
    title: "Só de um lado",
    lesson:
      "Cada lado tem a sua versão: `padding-top`, `padding-right`, `padding-bottom` e `padding-left`. O mesmo vale para `margin` e `border`.",
    goal: "Dê 40px de padding só do lado esquerdo do bloco 1.",
    hint: "Existe uma versão da propriedade para cada lado, e o nome termina com o lado.",
    solution: "padding-left: 40px;",
    allowed: PADDING,
    items: 2,
    target: 0,
    container: CONTAINER,
    item: BOX,
  },
  {
    id: "house-border",
    mode: "box",
    title: "A borda",
    lesson:
      "A borda fica entre o padding e a margem. Ela precisa de uma largura, de um estilo (`solid`, `dashed`...) e, se quiser, de uma cor. No atalho `border`, a ordem é: largura, estilo, cor.",
    goal: "Dê ao bloco 1 uma borda sólida de 4px.",
    hint: "Uma borda precisa de largura e de estilo. Sem o estilo, ela simplesmente não aparece.",
    solution: "border: 4px solid;",
    allowed: ["border", "border-width", "border-style"],
    items: 2,
    target: 0,
    container: CONTAINER,
    item: BOX,
  },
  {
    id: "house-margin-side",
    mode: "box",
    title: "Espaço por fora",
    lesson:
      "A `margin` é o espaço de fora da caixa: ela afasta o bloco dos vizinhos e das bordas do pai, e não é pintada com a cor de fundo.",
    goal: "Empurre o bloco 2 para a direita, 60px.",
    hint: "É a propriedade do espaço por fora da caixa, e você só quer afastar o bloco do lado esquerdo.",
    solution: "margin-left: 60px;",
    allowed: MARGIN,
    items: 3,
    target: 1,
    container: CONTAINER,
    item: BOX,
  },
  {
    id: "house-margin-bottom",
    mode: "box",
    title: "Afastando os vizinhos",
    lesson:
      "Em blocos empilhados, a margem de baixo de um bloco empurra o próximo para longe. Atenção: duas margens verticais que se tocam não se somam, vale a maior delas.",
    goal: "Afaste os blocos 2 e 3 do bloco 1, com 25px de margem.",
    hint: "O espaço precisa ficar do lado de baixo do bloco 1, por fora da caixa.",
    solution: "margin-bottom: 25px;",
    allowed: MARGIN,
    items: 3,
    target: 0,
    container: CONTAINER,
    item: BOX,
  },
  {
    id: "house-margin-auto",
    mode: "box",
    title: "Centralizando com margem",
    lesson:
      "Um bloco com largura fixa pode ser centralizado na horizontal com margens automáticas: o navegador reparte o espaço que sobra igualmente dos dois lados. É assim que se centraliza uma página, sem flexbox.",
    goal: "Centralize o bloco 1 na horizontal.",
    hint: "Existe uma palavra especial que vai no lugar do valor e deixa o navegador calcular a margem. Os lados (esquerda e direita) devem receber a mesma.",
    solution: "margin: 0 auto;",
    allowed: MARGIN,
    items: 2,
    target: 0,
    container: CONTAINER,
    item: BOX,
  },
  {
    id: "house-parent-padding",
    mode: "box",
    title: "Espaço no pai",
    lesson:
      "O padding também serve para afastar o conteúdo das bordas de um container. Aqui o CSS vale para o quadro todo, e os blocos dentro dele se afastam das bordas.",
    goal: "Afaste os blocos 24px das bordas do quadro.",
    hint: "Você não vai mexer nos blocos, e sim no pai deles. Qual propriedade dá espaço interno?",
    solution: "padding: 24px;",
    allowed: PADDING,
    items: 2,
    container: CONTAINER,
    item: BOX,
  },
  {
    id: "house-box-sizing",
    mode: "box",
    title: "A caixa que engorda",
    lesson:
      "Por padrão (`content-box`), `width` e `height` medem só o conteúdo: o padding e a borda são somados por fora, e a caixa fica maior do que você pediu. Com `border-box`, esses valores já incluem o padding e a borda.",
    goal: "Faça o bloco 1 ocupar exatamente 100px de largura e 60px de altura, no total.",
    hint: "Hoje a largura e a altura contam só o conteúdo. Existe um valor que faz elas contarem tudo, até a borda.",
    solution: "box-sizing: border-box;",
    allowed: ["box-sizing"],
    items: 1,
    target: 0,
    container: CONTAINER,
    item: `${BOX} height: 60px; padding: 20px; border: 5px solid;`,
  },
  {
    id: "house-width-sum",
    mode: "box",
    title: "A conta da largura",
    lesson:
      "No `content-box`, a largura total é: conteúdo + padding dos dois lados + borda dos dois lados. Aqui, o conteúdo tem 100px, o padding é 20px e a borda é 5px, então o bloco mede 150px de largura.",
    goal: "Faça o bloco 1 ocupar 200px de largura no total, sem mudar a altura.",
    hint: "A largura só conta o conteúdo. Some o padding e a borda dos dois lados e veja quanto falta para chegar a 200px.",
    solution: "width: 150px;",
    allowed: ["width"],
    items: 1,
    target: 0,
    container: CONTAINER,
    item: `${BOX} padding: 20px; border: 5px solid;`,
  },
  {
    id: "house-final",
    mode: "box",
    title: "A casa completa",
    lesson:
      "Agora é juntar tudo: a margem afasta o bloco dos vizinhos, a borda desenha o contorno e o padding dá folga ao conteúdo. Lembre a ordem, de dentro para fora: conteúdo, padding, borda, margem.",
    goal: "Dê ao bloco 1 20px de margem, 15px de padding e uma borda sólida de 3px.",
    hint: "Três propriedades, uma para cada camada. A margem fica por fora, a borda no meio e o padding por dentro.",
    solution: "margin: 20px; padding: 15px; border: 3px solid;",
    allowed: [...MARGIN, ...PADDING, "border", "border-width", "border-style"],
    items: 2,
    target: 0,
    container: CONTAINER,
    item: BOX,
  },
];
