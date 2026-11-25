export interface Rule {
  selector: string;
  css: string;
}

interface Base {
  id: string;
  title: string;
  /** What the level teaches, in a couple of sentences. */
  lesson: string;
  hint: string;
  /** Shown after the player gets it right: why. */
  explanation: string;
}

/** Which colour wins? The page and the rules are fixed, written here, so they are safe to render. */
export interface PickLevel extends Base {
  kind: "pick";
  html: string;
  /** The rules, in the order they are written in the stylesheet. */
  rules: Rule[];
  /** Selector of the element the question is about. */
  target: string;
  question: string;
  /** The value of the colour that wins. */
  answer: string;
}

/** Put the selectors in order of weight. */
export interface OrderLevel extends Base {
  kind: "order";
  /** The selectors, in the order they are shown (not sorted). */
  selectors: string[];
}

export type CableLevel = PickLevel | OrderLevel;

export const COLORS = [
  { value: "red", label: "vermelho" },
  { value: "blue", label: "azul" },
  { value: "green", label: "verde" },
  { value: "orange", label: "laranja" },
  { value: "purple", label: "roxo" },
] as const;

export const cableLevels: CableLevel[] = [
  {
    id: "cable-class",
    kind: "pick",
    title: "Classe ou tag?",
    lesson:
      "Quando duas regras mandam no mesmo elemento, o navegador escolhe a mais **específica**. Cada seletor tem um peso: o nome de uma tag pesa pouco, e uma classe pesa mais.",
    html: `<p class="destaque">Olá!</p>`,
    rules: [
      { selector: "p", css: "color: blue;" },
      { selector: ".destaque", css: "color: red;" },
    ],
    target: "p",
    question: "De que cor fica o texto?",
    answer: "red",
    hint: "Cada tipo de seletor tem um peso. Qual pesa mais: o nome da tag ou a classe?",
    explanation: "Uma classe pesa mais que uma tag, então `.destaque` vence `p`.",
  },
  {
    id: "cable-id",
    kind: "pick",
    title: "A carteirada",
    lesson:
      "O `#id` é o seletor mais pesado dos três: um único id vale mais que qualquer quantidade de classes.",
    html: `<p id="aviso" class="destaque">Olá!</p>`,
    rules: [
      { selector: "#aviso", css: "color: green;" },
      { selector: ".destaque", css: "color: red;" },
    ],
    target: "p",
    question: "De que cor fica o texto?",
    answer: "green",
    hint: "Há um seletor que pesa mais que a classe e só pode aparecer uma vez na página.",
    explanation: "O id pesa mais que a classe, então `#aviso` vence, mesmo escrito antes.",
  },
  {
    id: "cable-tie",
    kind: "pick",
    title: "Empate",
    lesson:
      "Quando os seletores pesam igual, o desempate é a posição no CSS: vale a regra escrita **por último**. A ordem das classes no HTML não importa.",
    html: `<p class="b a">Olá!</p>`,
    rules: [
      { selector: ".a", css: "color: orange;" },
      { selector: ".b", css: "color: purple;" },
    ],
    target: "p",
    question: "De que cor fica o texto?",
    answer: "purple",
    hint: "Os dois seletores têm o mesmo peso. Quando empata, o que decide é a posição das regras no arquivo, não a ordem das classes no HTML.",
    explanation:
      'As duas classes pesam o mesmo, então vale a regra escrita por último: `.b`. A ordem em `class="b a"` não faz diferença.',
  },
  {
    id: "cable-order-no-help",
    kind: "pick",
    title: "Escrever depois não basta",
    lesson:
      "Ser a última regra só ajuda quando o peso é igual. Uma regra mais fraca escrita depois continua perdendo.",
    html: `<p id="aviso">Olá!</p>`,
    rules: [
      { selector: "#aviso", css: "color: green;" },
      { selector: "p", css: "color: blue;" },
    ],
    target: "p",
    question: "De que cor fica o texto?",
    answer: "green",
    hint: "Uma regra escrita depois só ganha se pesar o mesmo ou mais.",
    explanation:
      "`p` vem depois, mas pesa menos que `#aviso`. O peso vem primeiro; a ordem só desempata.",
  },
  {
    id: "cable-more-parts",
    kind: "pick",
    title: "Quanto mais, mais forte",
    lesson:
      "Os pesos se somam: `.cartao p` tem uma classe **e** uma tag, e por isso pesa mais que só `p`.",
    html: `<div class="cartao"><p>Olá!</p></div>`,
    rules: [
      { selector: ".cartao p", css: "color: red;" },
      { selector: "p", css: "color: blue;" },
    ],
    target: "p",
    question: "De que cor fica o texto?",
    answer: "red",
    hint: "Some o peso de cada parte do seletor.",
    explanation: "`.cartao p` pesa uma classe mais uma tag; `p` pesa só uma tag.",
  },
  {
    id: "cable-count",
    kind: "pick",
    title: "A conta fechada",
    lesson:
      "Para comparar, conte cada seletor em três colunas: ids, classes e tags, nessa ordem de importância. Compare coluna por coluna, da esquerda para a direita.",
    html: `<div class="cartao"><p class="destaque">Olá!</p></div>`,
    rules: [
      { selector: ".cartao p", css: "color: orange;" },
      { selector: ".destaque", css: "color: green;" },
    ],
    target: "p",
    question: "De que cor fica o texto?",
    answer: "orange",
    hint: "Faça a conta de cada seletor: quantos ids, quantas classes e quantas tags?",
    explanation:
      "`.cartao p` = 0 ids, 1 classe, 1 tag. `.destaque` = 0 ids, 1 classe, 0 tags. As classes empatam, e a tag a mais decide.",
  },
  {
    id: "cable-order-1",
    kind: "order",
    title: "Fila de peso",
    lesson:
      "Agora a conta é sua: coloque os seletores em ordem, do mais fraco ao mais forte. Clique nos seletores na ordem em que eles ganham da disputa.",
    selectors: ["#aviso", "p", "p.destaque", ".destaque"],
    hint: "Comece pelo seletor só com tag. Uma classe pesa mais que uma tag, e um id pesa mais que qualquer número de classes.",
    explanation: "`p` (0,0,1) < `.destaque` (0,1,0) < `p.destaque` (0,1,1) < `#aviso` (1,0,0).",
  },
  {
    id: "cable-inherit",
    kind: "pick",
    title: "Herança fraca",
    lesson:
      "Algumas propriedades, como `color`, passam do pai para os filhos. Mas uma cor herdada perde para **qualquer** regra que mire o elemento diretamente, por mais fraca que seja.",
    html: `<div class="caixa"><p>Olá!</p></div>`,
    rules: [
      { selector: ".caixa", css: "color: red;" },
      { selector: "p", css: "color: blue;" },
    ],
    target: "p",
    question: "De que cor fica o texto do parágrafo?",
    answer: "blue",
    hint: "Uma cor herdada do pai só vale quando nenhuma regra mira o elemento diretamente.",
    explanation:
      "`.caixa` pesa mais, mas só a herança chega ao `p` por ele. Como `p` tem uma regra própria, a herança nem entra na disputa.",
  },
  {
    id: "cable-attribute",
    kind: "pick",
    title: "Atributo também pesa",
    lesson:
      'Seletores de atributo, como `[type="text"]`, pesam o mesmo que uma classe. Aqui a disputa acaba empatada.',
    html: `<input type="text" class="campo" value="Olá!">`,
    rules: [
      { selector: ".campo", css: "color: green;" },
      { selector: '[type="text"]', css: "color: red;" },
    ],
    target: "input",
    question: "De que cor fica o texto do campo?",
    answer: "red",
    hint: "Um seletor de atributo pesa o mesmo que uma classe. E quando empata?",
    explanation: "O atributo e a classe pesam igual (0,1,0), e a última regra vence.",
  },
  {
    id: "cable-pseudo",
    kind: "pick",
    title: "Pseudoclasse conta",
    lesson:
      "Uma pseudoclasse, como `:first-child`, também pesa como uma classe. O seletor `li:first-child` tem uma pseudoclasse e uma tag.",
    html: `<ul><li class="item">Primeiro</li><li class="item">Segundo</li></ul>`,
    rules: [
      { selector: "li:first-child", css: "color: red;" },
      { selector: ".item", css: "color: blue;" },
    ],
    target: "li",
    question: "De que cor fica o texto do PRIMEIRO item?",
    answer: "red",
    hint: "A pseudoclasse pesa o mesmo que uma classe, e a tag ainda soma por cima.",
    explanation:
      "`li:first-child` = 0,1,1 (uma pseudoclasse, uma tag) e `.item` = 0,1,0. Venceu a que pesa mais, mesmo escrita antes.",
  },
  {
    id: "cable-inline",
    kind: "pick",
    title: "O estilo na própria tag",
    lesson:
      "O atributo `style` escrito direto no HTML (estilo inline) vence qualquer seletor, até um id.",
    html: `<p id="aviso" style="color: purple;">Olá!</p>`,
    rules: [{ selector: "#aviso", css: "color: green;" }],
    target: "p",
    question: "De que cor fica o texto?",
    answer: "purple",
    hint: "Existe algo mais forte que um id, escrito direto no HTML.",
    explanation: "O estilo inline vem acima de todos os seletores.",
  },
  {
    id: "cable-important",
    kind: "pick",
    title: "O botão de emergência",
    lesson:
      "`!important` passa por cima de tudo, até do estilo inline. Por isso é a última saída: quando duas regras têm `!important`, volta a valer o peso do seletor.",
    html: `<p id="aviso" style="color: purple;">Olá!</p>`,
    rules: [
      { selector: "#aviso", css: "color: green;" },
      { selector: "p", css: "color: blue !important;" },
    ],
    target: "p",
    question: "De que cor fica o texto?",
    answer: "blue",
    hint: "Existe um marcador que passa por cima até do estilo escrito direto na tag.",
    explanation:
      "`!important` vence o inline e o id, mesmo em um seletor fraquinho como `p`. Use com muito cuidado: é difícil de desfazer.",
  },
  {
    id: "cable-order-2",
    kind: "order",
    title: "Fila de peso II",
    lesson: "Mais seletores, mais contas. Do mais fraco ao mais forte.",
    selectors: ["#app", ".tema .destaque p", "div p", "#app .destaque", "ul li:first-child"],
    hint: "Conte em três colunas (ids, classes, tags) e compare da esquerda para a direita: uma coluna da esquerda sempre ganha das que estão à direita dela.",
    explanation:
      "`div p` (0,0,2) < `ul li:first-child` (0,1,2) < `.tema .destaque p` (0,2,1) < `#app` (1,0,0) < `#app .destaque` (1,1,0).",
  },
  {
    id: "cable-boss",
    kind: "pick",
    title: "Cabo de guerra final",
    lesson:
      "Tudo junto: peso, ordem e `!important`. Primeiro veja quais regras têm `!important`: só elas disputam. Entre elas, vale o peso do seletor.",
    html: `<div id="app" class="tema"><p class="destaque">Olá!</p></div>`,
    rules: [
      { selector: "#app p", css: "color: red;" },
      { selector: ".tema .destaque", css: "color: blue;" },
      { selector: "p.destaque", css: "color: green !important;" },
      { selector: ".destaque", css: "color: orange !important;" },
    ],
    target: "p",
    question: "De que cor fica o texto?",
    answer: "green",
    hint: "Descarte as regras sem `!important`. Entre as que sobram, faça a conta do peso de cada seletor.",
    explanation:
      "Só as duas regras com `!important` disputam. `p.destaque` (0,1,1) pesa mais que `.destaque` (0,1,0), então vence.",
  },
];
