import type { Level } from "./levels";

/** Everything the buggy CSS of this game may use, so a typo is told apart from a real property. */
const ALLOWED = [
  "display",
  "justify-content",
  "align-items",
  "flex-direction",
  "flex-wrap",
  "gap",
  "grid-template-columns",
];

const BOX = "width: 44px; height: 44px;";

/**
 * The levels of Caça-Bugs: the editor starts with CSS that has a defect and the player
 * fixes it until the board matches the goal. The CSS is the whole rule of the container, so the
 * bug can be anywhere in it, even in `display`.
 */
export const bugLevels: Level[] = [
  {
    id: "bug-typo",
    mode: "bug",
    title: "O erro de digitação",
    lesson:
      "O navegador **ignora em silêncio** o que não entende: uma propriedade com o nome errado não gera erro, ela só não faz nada. Nas ferramentas do navegador, a linha aparece riscada. Aqui, o editor avisa embaixo.",
    goal: "Os blocos deveriam estar centralizados na horizontal. Conserte o CSS.",
    hint: "Leia o nome de cada propriedade letra por letra, e veja qual aviso aparece embaixo do editor.",
    solution: "display: flex; justify-content: center;",
    start: "display: flex;\njustfy-content: center;",
    allowed: ALLOWED,
    items: 3,
    container: "",
    item: BOX,
  },
  {
    id: "bug-value",
    mode: "bug",
    title: "A palavra errada",
    lesson:
      "Não é só o nome que pode estar errado: o valor também. CSS usa palavras em inglês, e `centre` ou `middle` não valem. Quando o valor não é entendido, a declaração inteira é descartada.",
    goal: "Os blocos deveriam estar centralizados na horizontal.",
    hint: "O nome da propriedade está certo, mas o navegador não entendeu o valor. Compare com a palavra em inglês.",
    solution: "display: flex; justify-content: center;",
    start: "display: flex;\njustify-content: centre;",
    allowed: ALLOWED,
    items: 3,
    container: "",
    item: BOX,
  },
  {
    id: "bug-semicolon",
    mode: "bug",
    title: "Duas linhas viraram uma",
    lesson:
      "O ponto e vírgula é o que separa as declarações. Sem ele, o navegador continua lendo na linha de baixo como se fosse parte do mesmo valor, e descarta tudo.",
    goal: "Os blocos deveriam estar espalhados de ponta a ponta.",
    hint: "O navegador lê um valor até achar um ponto e vírgula. Veja onde a primeira declaração deveria terminar.",
    solution: "display: flex; justify-content: space-between;",
    start: "display: flex\njustify-content: space-between;",
    allowed: ALLOWED,
    items: 4,
    container: "",
    item: BOX,
  },
  {
    id: "bug-colon",
    mode: "bug",
    title: "Pontuação trocada",
    lesson:
      "Uma declaração tem sempre a forma `propriedade: valor;`. Dois-pontos entre o nome e o valor, ponto e vírgula no fim. Trocar um pelo outro quebra a linha.",
    goal: "Os blocos deveriam estar centralizados na vertical.",
    hint: "Entre o nome da propriedade e o valor vai um sinal diferente do que está lá.",
    solution: "display: flex; align-items: center;",
    start: "display: flex;\nalign-items; center;",
    allowed: ALLOWED,
    items: 3,
    container: "",
    item: BOX,
  },
  {
    id: "bug-axis",
    mode: "bug",
    title: "Certo, mas no eixo errado",
    lesson:
      "Alguns defeitos não geram aviso nenhum: o CSS é válido, só que faz outra coisa. Com `flex-direction: column`, o eixo principal vira o vertical, então `justify-content` age na vertical e `align-items` na horizontal.",
    goal: "Os blocos deveriam estar empilhados e centralizados na horizontal.",
    hint: "Não há erro de escrita: o CSS é válido, mas faz outra coisa. Pense em qual eixo cada propriedade age quando a direção é coluna.",
    solution: "display: flex; flex-direction: column; align-items: center;",
    start: "display: flex;\nflex-direction: column;\njustify-content: center;",
    allowed: ALLOWED,
    items: 3,
    container: "",
    item: BOX,
  },
  {
    id: "bug-display",
    mode: "bug",
    title: "Faltou ligar o flexbox",
    lesson:
      "As propriedades de alinhamento só têm efeito depois que o container escolhe o modo de layout com `display`. Sem isso, `justify-content` e `gap` são válidas, mas não têm nada para fazer.",
    goal: "Os blocos deveriam estar lado a lado, centralizados e com 10px entre eles.",
    hint: "As propriedades de alinhamento só funcionam depois que o container ativa o modo certo. Falta uma linha.",
    solution: "display: flex; justify-content: center; gap: 10px;",
    start: "justify-content: center;\ngap: 10px;",
    allowed: ALLOWED,
    items: 3,
    container: "",
    item: BOX,
  },
  {
    id: "bug-plural",
    mode: "bug",
    title: "Singular ou plural?",
    lesson:
      "Muitos nomes de propriedade são parecidos e só diferem por uma letra. Uma coluna é `column`, mas a lista de colunas do grid é no plural.",
    goal: "Os blocos deveriam estar em duas colunas iguais.",
    hint: "Compare o nome da propriedade com o da lição de colunas do grid: tem uma letra a mais ou a menos.",
    solution: "display: grid; grid-template-columns: 1fr 1fr;",
    start: "display: grid;\ngrid-template-column: 1fr 1fr;",
    allowed: ALLOWED,
    items: 4,
    container: "grid-auto-rows: 50px; gap: 8px;",
  },
  {
    id: "bug-unit",
    mode: "bug",
    title: "O número sozinho",
    lesson:
      "Comprimentos precisam de unidade: `20px`, `2rem`, `50%`. Um número solto não vale. A única exceção é o zero, que dispensa a unidade.",
    goal: "Os blocos deveriam estar lado a lado com 20px entre eles.",
    hint: "Comprimentos precisam de unidade, e o aviso embaixo do editor mostra qual valor não foi entendido.",
    solution: "display: flex; gap: 20px;",
    start: "display: flex;\ngap: 20;",
    allowed: ALLOWED,
    items: 4,
    container: "",
    item: BOX,
  },
  {
    id: "bug-override",
    mode: "bug",
    title: "Quem manda é a última",
    lesson:
      "Quando duas declarações definem a mesma propriedade, vale a que vem por último. Aqui não há erro de escrita nem aviso: o CSS está certo, mas uma linha desfaz a outra.",
    goal: "Os blocos deveriam estar centralizados na horizontal.",
    hint: "Quando duas linhas definem a mesma propriedade, só uma vale. Qual delas?",
    solution: "display: flex; justify-content: center;",
    start: "display: flex;\njustify-content: center;\njustify-content: flex-start;",
    allowed: ALLOWED,
    items: 3,
    container: "",
    item: BOX,
  },
  {
    id: "bug-boss",
    mode: "bug",
    title: "Caça aos bugs",
    lesson:
      "Este CSS tem mais de um defeito, de tipos diferentes. Corrija um de cada vez: depois de cada conserto, o quadro e os avisos mudam e mostram o que sobrou.",
    goal: "Os blocos deveriam estar empilhados, espalhados de cima a baixo e centralizados na horizontal.",
    hint: "São três defeitos de tipos que você já viu: um que faz duas linhas virarem uma, um valor que não é entendido e um nome de propriedade escrito errado.",
    solution:
      "display: flex; flex-direction: column; justify-content: space-between; align-items: center;",
    start:
      "display: flex\nflex-direction: colum;\njustfy-content: space-between;\nalign-items: center;",
    allowed: ALLOWED,
    items: 3,
    container: "",
    item: BOX,
  },
];
