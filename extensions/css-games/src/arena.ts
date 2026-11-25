export interface ArenaLevel {
  id: string;
  title: string;
  /** What the level shows or teaches, in a couple of sentences. */
  lesson: string;
  goal: string;
  hint: string;
  /** The colours of the picture, as a help. */
  colors: string[];
  /** The page that draws the target. It is also what "Ver solução" types in. */
  html: string;
  css: string;
}

export const MATCH_GOAL = 98;

export const arenaLevels: ArenaLevel[] = [
  {
    id: "arena-square",
    title: "O primeiro quadrado",
    lesson:
      "Aqui você recria uma imagem usando só HTML e CSS, sem figuras. A cena mede 400×300 px e o `body` é o fundo dela: escreva os elementos no HTML e estilize no CSS. A comparação é pixel por pixel.",
    goal: "Recrie a imagem: um quadrado de 100×100 px no centro.",
    hint: "Pinte o `body` e centralize um `div` de tamanho fixo. O flexbox centraliza nos dois eixos.",
    colors: ["#1b2a41", "#f4a261"],
    html: `<div></div>`,
    css: `body {
  display: flex;
  justify-content: center;
  align-items: center;
  background: #1b2a41;
}
div {
  width: 100px;
  height: 100px;
  background: #f4a261;
}`,
  },
  {
    id: "arena-moon",
    title: "Lua cheia",
    lesson:
      'Não existe um "círculo" em CSS: ele é um quadrado com os cantos arredondados até não sobrar canto.',
    goal: "Recrie a imagem: um círculo de 120 px de diâmetro no centro.",
    hint: "Um círculo é um quadrado com os cantos totalmente arredondados.",
    colors: ["#0b132b", "#f1faee"],
    html: `<div></div>`,
    css: `body {
  display: flex;
  justify-content: center;
  align-items: center;
  background: #0b132b;
}
div {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: #f1faee;
}`,
  },
  {
    id: "arena-pair",
    title: "Dupla",
    lesson:
      "Com `justify-content` dá para distribuir os blocos pelo espaço: `space-around`, `space-between` e `space-evenly` dão resultados diferentes. Compare com a imagem.",
    goal: "Recrie a imagem: dois quadrados de 80 px, com o mesmo espaço em volta de cada um.",
    hint: "Dois blocos lado a lado, com espaço igual em volta deles: pense nas opções de `justify-content`.",
    colors: ["#264653", "#e9c46a", "#e76f51"],
    html: `<div></div>
<div></div>`,
    css: `body {
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: #264653;
}
div {
  width: 80px;
  height: 80px;
}
div:nth-child(1) {
  background: #e9c46a;
}
div:nth-child(2) {
  background: #e76f51;
}`,
  },
  {
    id: "arena-flag",
    title: "Bandeira",
    lesson:
      "Quando vários elementos têm a mesma tag, escolha cada um pela posição: `:nth-child(1)` é o primeiro filho, `:nth-child(2)` o segundo, e assim por diante.",
    goal: "Recrie a imagem: três faixas horizontais, cada uma com 100 px de altura.",
    hint: "Três `div` de 100px de altura. Para dar uma cor a cada um, escolha-os pela posição.",
    colors: ["#2a9d8f", "#e9c46a", "#e76f51"],
    html: `<div></div>
<div></div>
<div></div>`,
    css: `div {
  height: 100px;
}
div:nth-child(1) {
  background: #2a9d8f;
}
div:nth-child(2) {
  background: #e9c46a;
}
div:nth-child(3) {
  background: #e76f51;
}`,
  },
  {
    id: "arena-target",
    title: "Alvo",
    lesson:
      "Um elemento dentro do outro herda o centro do pai quando o pai usa flexbox. O seletor `>` pega só os filhos diretos, e `div div` pega os descendentes: use os dois para estilizar cada anel.",
    goal: "Recrie a imagem: três círculos concêntricos, de 240, 160 e 80 px.",
    hint: "Três círculos, um dentro do outro, todos centralizados. Cada `div` guarda o próximo.",
    colors: ["#a8dadc", "#e63946", "#f1faee", "#1d3557"],
    html: `<div>
  <div>
    <div></div>
  </div>
</div>`,
    css: `body {
  display: flex;
  justify-content: center;
  align-items: center;
  background: #a8dadc;
}
div {
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
}
body > div {
  width: 240px;
  height: 240px;
  background: #e63946;
}
div div {
  width: 160px;
  height: 160px;
  background: #f1faee;
}
div div div {
  width: 80px;
  height: 80px;
  background: #1d3557;
}`,
  },
  {
    id: "arena-checker",
    title: "Faixa xadrez",
    lesson:
      "`:nth-child(odd)` pega os filhos de posição ímpar (1º, 3º, 5º...), e `:nth-child(even)` os de posição par. É a base de qualquer padrão que se repete.",
    goal: "Recrie a imagem: oito quadrados de 50 px, lado a lado, no meio da altura.",
    hint: "São oito quadrados de 50px. Pintar de dois em dois é trabalho para uma pseudoclasse de posição.",
    colors: ["#e9c46a", "#264653"],
    html: `<div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>`,
    css: `body {
  display: flex;
  align-items: center;
  background: #e9c46a;
}
div {
  width: 50px;
  height: 50px;
}
div:nth-child(odd) {
  background: #264653;
}`,
  },
  {
    id: "arena-traffic",
    title: "Semáforo",
    lesson:
      "Você pode misturar tags: aqui, um `div` guarda três `span`. Dê `display: block` ou use flexbox no pai para que os `span` aceitem largura e altura.",
    goal: "Recrie a imagem: uma caixa de 100×240 px com três círculos de 60 px, com o mesmo espaço entre eles.",
    hint: "Uma caixa com três círculos dentro, empilhados e com espaço igual em volta. O flexbox também funciona na vertical.",
    colors: ["#222222", "#333333", "#e63946", "#ffd166", "#06d6a0"],
    html: `<div>
  <span></span>
  <span></span>
  <span></span>
</div>`,
    css: `body {
  display: flex;
  justify-content: center;
  align-items: center;
  background: #222;
}
div {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  width: 100px;
  height: 240px;
  border-radius: 20px;
  background: #333;
}
span {
  width: 60px;
  height: 60px;
  border-radius: 50%;
}
span:nth-child(1) {
  background: #e63946;
}
span:nth-child(2) {
  background: #ffd166;
}
span:nth-child(3) {
  background: #06d6a0;
}`,
  },
  {
    id: "arena-sunset",
    title: "Pôr do sol",
    lesson:
      "Fundos podem ser degradês, como `linear-gradient(cor1, cor2)`, que vai de cima para baixo. Um bloco desenhado depois cobre o que veio antes, e uma margem negativa deixa um bloco entrar no outro.",
    goal: "Recrie a imagem: um degradê de cima para baixo, o sol (100 px) afundando no mar (100 px de altura).",
    hint: "O fundo é um degradê de cima para baixo com as duas primeiras cores da lista. O sol afunda no mar: uma margem negativa e a ordem das caixas resolvem.",
    colors: ["#ff9e00", "#ff4d6d", "#fff3b0", "#1b263b"],
    html: `<div class="sol"></div>
<div class="mar"></div>`,
    css: `body {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  background: linear-gradient(#ff9e00, #ff4d6d);
}
.sol {
  width: 100px;
  height: 100px;
  margin-bottom: -50px;
  border-radius: 50%;
  background: #fff3b0;
}
.mar {
  width: 100%;
  height: 100px;
  background: #1b263b;
}`,
  },
];
