export interface SelectorLevel {
  id: string;
  title: string;
  /** What the selector does, in a couple of sentences. */
  lesson: string;
  /** The task, in one line. */
  goal: string;
  hint: string;
  /** The selector that picks the right elements: the goal is drawn with it. */
  solution: string;
  /** The page to select from. Fixed and written here, so it is safe to render as it is. */
  html: string;
}

export const selectorLevels: SelectorLevel[] = [
  {
    id: "sel-tag",
    title: "Pelo nome da tag",
    lesson:
      "O seletor mais simples é o nome da tag: `p` pega todos os parágrafos da página, `li` pega todos os itens de lista.",
    goal: "Selecione todos os parágrafos.",
    hint: "Aqui não precisa de nenhum símbolo: é só o nome da tag.",
    solution: "p",
    html: `<h2>Receita</h2>
<p>Misture tudo.</p>
<p>Leve ao forno.</p>
<span>20 minutos</span>`,
  },
  {
    id: "sel-class",
    title: "Pela classe",
    lesson:
      'Uma classe vira seletor com um ponto na frente: `.fruta` pega todos os elementos com `class="fruta"`, seja qual for a tag.',
    goal: "Selecione só as frutas.",
    hint: "Classes começam com um ponto. Olhe qual classe as frutas têm.",
    solution: ".fruta",
    html: `<ul>
  <li class="fruta">Maçã</li>
  <li class="legume">Cenoura</li>
  <li class="fruta">Uva</li>
  <li class="legume">Batata</li>
</ul>`,
  },
  {
    id: "sel-id",
    title: "Pelo id",
    lesson:
      'Um `id` é único na página e vira seletor com `#`: `#premio` pega o elemento com `id="premio"`.',
    goal: "Abra o baú certo: o do prêmio.",
    hint: "Ids usam outro símbolo, o `#`. Procure o `id` no HTML.",
    solution: "#premio",
    html: `<div class="bau">Vazio</div>
<div class="bau" id="premio">Tesouro</div>
<div class="bau">Vazio</div>`,
  },
  {
    id: "sel-group",
    title: "Vários de uma vez",
    lesson: "A vírgula junta seletores: `h2, .aviso` pega tudo o que casa com um ou com o outro.",
    goal: "Selecione o título e o aviso.",
    hint: "Escreva um seletor para cada alvo e separe-os com uma vírgula.",
    solution: "h2, .aviso",
    html: `<h2>Atenção</h2>
<p>Texto comum.</p>
<p class="aviso">Piso molhado!</p>
<small>nota de rodapé</small>`,
  },
  {
    id: "sel-descendant",
    title: "Descendente",
    lesson:
      "Um espaço entre dois seletores pega o segundo só quando ele está dentro do primeiro, em qualquer nível: `.cartao span` pega os `span` dentro de `.cartao`, e ignora os de fora.",
    goal: "Selecione os `span` que estão dentro do cartão.",
    hint: "Escreva primeiro o pai, depois um espaço e depois o que você quer pegar dentro dele.",
    solution: ".cartao span",
    html: `<div class="cartao">
  <h3>Ana</h3>
  <span>Aluna</span>
  <p><span>10 anos</span></p>
</div>
<span>Fora do cartão</span>`,
  },
  {
    id: "sel-child",
    title: "Filho direto",
    lesson:
      "O `>` é mais exigente que o espaço: `.menu > li` só pega os `li` que são filhos diretos de `.menu`, sem os que estão em listas aninhadas.",
    goal: "Selecione só os itens do primeiro nível do menu.",
    hint: "Existe um símbolo entre dois seletores que exige parentesco direto: pai e filho, sem nada no meio.",
    solution: ".menu > li",
    html: `<ul class="menu">
  <li>Início</li>
  <li>Produtos
    <ul>
      <li>Camisas</li>
      <li>Calças</li>
    </ul>
  </li>
  <li>Contato</li>
</ul>`,
  },
  {
    id: "sel-attribute",
    title: "Por atributo",
    lesson:
      'Colchetes selecionam pelo atributo: `[type="checkbox"]` pega os elementos com `type="checkbox"`. Sem valor, `[disabled]` pega todos que têm o atributo.',
    goal: "Selecione só as caixas de marcar.",
    hint: 'Atributos ficam entre colchetes, no formato nome="valor".',
    solution: '[type="checkbox"]',
    html: `<input type="text" value="nome">
<input type="checkbox">
<input type="checkbox" checked>
<input type="radio">`,
  },
  {
    id: "sel-prefix",
    title: "Atributo que começa com…",
    lesson:
      '`^=` quer dizer "começa com": `[href^="https"]` pega os links cujo endereço começa com `https`. Também existem `$=` (termina com) e `*=` (contém).',
    goal: "Selecione só os links seguros (https).",
    hint: "Dentro dos colchetes, um sinal antes do `=` muda o jeito de comparar: aqui o valor só precisa começar igual.",
    solution: '[href^="https"]',
    html: `<a href="https://exemplo.com">Exemplo</a>
<a href="/sobre">Sobre</a>
<a href="https://loja.com">Loja</a>
<a href="http://antigo.com">Antigo</a>`,
  },
  {
    id: "sel-first-child",
    title: "O primeiro filho",
    lesson:
      "Pseudoclasses começam com dois pontos. `:first-child` pega o elemento que é o primeiro filho do seu pai: `li:first-child` pega o primeiro `li` de cada lista.",
    goal: "Selecione o primeiro item de cada lista.",
    hint: "Pseudoclasses vêm depois de dois pontos. Qual delas fala do primeiro filho?",
    solution: "li:first-child",
    html: `<ul>
  <li>Pão</li>
  <li>Leite</li>
  <li>Ovos</li>
</ul>
<ul>
  <li>Lápis</li>
  <li>Caderno</li>
</ul>`,
  },
  {
    id: "sel-last-child",
    title: "O último filho",
    lesson: "O contrário: `:last-child` pega o elemento que é o último filho do seu pai.",
    goal: "Selecione o último item de cada lista.",
    hint: "Parecido com a fase anterior, mas com a pseudoclasse do último filho.",
    solution: "li:last-child",
    html: `<ul>
  <li>Pão</li>
  <li>Leite</li>
  <li>Ovos</li>
</ul>
<ul>
  <li>Lápis</li>
  <li>Caderno</li>
</ul>`,
  },
  {
    id: "sel-nth-child",
    title: "Pela posição",
    lesson:
      "`:nth-child()` escolhe pela posição: `:nth-child(3)` é o terceiro, `:nth-child(even)` são os pares e `:nth-child(odd)` os ímpares. Dá para usar fórmulas, como `:nth-child(3n)`.",
    goal: "Selecione os itens de posição par (2º, 4º, 6º), como numa tabela zebrada.",
    hint: "Esse seletor aceita, entre parênteses, uma palavra (em inglês) que descreve a posição: pense em pares e ímpares.",
    solution: "li:nth-child(even)",
    html: `<ul>
  <li>1</li>
  <li>2</li>
  <li>3</li>
  <li>4</li>
  <li>5</li>
  <li>6</li>
</ul>`,
  },
  {
    id: "sel-compound",
    title: "Tag + classe",
    lesson:
      "Sem espaço, os seletores se somam: `button.perigo` só pega o que é `button` **e** tem a classe `perigo`. Um `a` com a mesma classe fica de fora.",
    goal: "Selecione só os botões perigosos, sem o link.",
    hint: "Cole a tag e a classe, sem espaço entre elas.",
    solution: "button.perigo",
    html: `<button class="perigo">Apagar</button>
<button>Salvar</button>
<a href="#" class="perigo">Sair</a>
<button class="perigo">Zerar</button>`,
  },
  {
    id: "sel-adjacent",
    title: "Irmão vizinho",
    lesson:
      "O `+` pega o elemento que vem logo depois do outro, no mesmo nível: `h2 + p` é o parágrafo que vem imediatamente depois de um título.",
    goal: "Selecione o parágrafo que vem logo depois de cada título.",
    hint: "Existe um símbolo que pega o elemento que vem logo em seguida a outro, no mesmo nível.",
    solution: "h2 + p",
    html: `<h2>Capítulo 1</h2>
<p>Abertura do capítulo 1.</p>
<p>Desenvolvimento.</p>
<h2>Capítulo 2</h2>
<p>Abertura do capítulo 2.</p>
<p>Desenvolvimento.</p>`,
  },
  {
    id: "sel-not",
    title: "Exclusão",
    lesson: "`:not()` exclui: `li:not(.feito)` pega os `li` que **não** têm a classe `feito`.",
    goal: "Selecione as tarefas que ainda faltam.",
    hint: "É uma pseudoclasse que recebe, entre parênteses, o seletor do que você quer deixar de fora.",
    solution: "li:not(.feito)",
    html: `<ul>
  <li class="feito">Acordar</li>
  <li>Estudar CSS</li>
  <li class="feito">Almoçar</li>
  <li>Treinar seletores</li>
</ul>`,
  },
  {
    id: "sel-boss",
    title: "Desafio final",
    lesson:
      "Hora de juntar tudo: descendente, classe e exclusão no mesmo seletor. Leia da esquerda para a direita e vá estreitando.",
    goal: "Selecione os links do menu, menos o que está ativo.",
    hint: "Divida em três partes: o menu, os links dentro dele e o que deve ficar de fora.",
    solution: ".menu a:not(.ativo)",
    html: `<nav class="menu">
  <a href="#" class="ativo">Início</a>
  <a href="#">Sobre</a>
  <a href="#">Contato</a>
</nav>
<a href="#">Voltar ao topo</a>`,
  },
];

export const MAX_SELECTOR = 200;

/**
 * The elements of `root` that `selector` picks, as their positions among all of its descendants.
 * `undefined` when the selector is empty or not valid CSS.
 */
export function pick(root: ParentNode, selector: string): number[] | undefined {
  const text = selector.trim();
  if (!text || text.length > MAX_SELECTOR) return undefined;
  const all = Array.from(root.querySelectorAll("*"));
  try {
    return Array.from(root.querySelectorAll(text), (el) => all.indexOf(el));
  } catch {
    return undefined;
  }
}

/** Whether two selections are the same set of elements, whatever the order. */
export function sameSelection(a: readonly number[], b: readonly number[]): boolean {
  const left = new Set(a);
  const right = new Set(b);
  return left.size === right.size && [...left].every((n) => right.has(n));
}
