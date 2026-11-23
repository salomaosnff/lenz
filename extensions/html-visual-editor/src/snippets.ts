import { placeholderImage } from "./model";

/** What the elements view inserts for a tag. */
export interface Snippet {
  html: string;
  /** `false`: it makes no sense inside the page, and `reason` says why. */
  insertable: boolean;
  reason?: string;
}

/** Elements that only exist outside the body of a page, or in a frameset. */
const NOT_IN_BODY: Record<string, string> = {
  html: "É a raiz do documento: a página já tem uma.",
  head: "Fica fora do corpo da página: guarda título, estilos e metadados.",
  body: "É o corpo da página: ela já tem um.",
  title: "Fica no cabeçalho do documento (head), não no corpo.",
  base: "Fica no cabeçalho do documento (head), não no corpo.",
  meta: "Fica no cabeçalho do documento (head), não no corpo.",
  frame:
    "Só existe dentro de um conjunto de quadros (frameset), que não funciona em páginas atuais.",
  frameset: "Substitui o corpo da página, o que não funciona em páginas atuais.",
  noframes:
    "Só existe junto de um conjunto de quadros (frameset), que não funciona em páginas atuais.",
};

const image = `<img src="${placeholderImage}" alt="Imagem" style="max-width:100%">`;

/**
 * Elements that only work inside another one are inserted together with it, so what is inserted
 * is already valid: a `li` comes in a `ul`, a `td` in a table.
 */
const SPECIFIC: Record<string, string> = {
  a: '<a href="#">Link</a>',
  img: image,
  input: '<input type="text" placeholder="Digite aqui">',
  button: '<button type="button">Botão</button>',
  iframe: '<iframe src="about:blank" style="width:100%;height:200px;border:0"></iframe>',
  video: '<video controls style="max-width:100%"></video>',
  audio: "<audio controls></audio>",
  canvas: '<canvas width="300" height="150"></canvas>',
  progress: '<progress value="50" max="100"></progress>',
  meter: '<meter value="0.6"></meter>',
  time: '<time datetime="2026-01-01">1 de janeiro de 2026</time>',
  svg: '<svg width="64" height="64" viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#8b5cf6"/></svg>',
  math: "<math><mi>x</mi><mo>=</mo><mn>1</mn></math>",
  textarea: '<textarea rows="3" placeholder="Digite aqui"></textarea>',
  select: "<select><option>Opção 1</option><option>Opção 2</option></select>",
  option: "<select><option>Opção</option></select>",
  optgroup: '<select><optgroup label="Grupo"><option>Opção</option></optgroup></select>',
  selectedcontent:
    '<select><button type="button"><selectedcontent></selectedcontent></button><option>Opção</option></select>',
  datalist: '<datalist><option value="Opção"></option></datalist>',
  ul: "<ul><li>Item 1</li><li>Item 2</li></ul>",
  ol: "<ol><li>Item 1</li><li>Item 2</li></ol>",
  menu: "<menu><li>Item 1</li><li>Item 2</li></menu>",
  dir: "<dir><li>Item 1</li><li>Item 2</li></dir>",
  li: "<ul><li>Item</li></ul>",
  dl: "<dl><dt>Termo</dt><dd>Descrição</dd></dl>",
  dt: "<dl><dt>Termo</dt></dl>",
  dd: "<dl><dd>Descrição</dd></dl>",
  table: "<table><tbody><tr><td>Célula</td></tr></tbody></table>",
  caption: "<table><caption>Legenda</caption><tbody><tr><td>Célula</td></tr></tbody></table>",
  colgroup:
    "<table><colgroup><col><col></colgroup><tbody><tr><td>A</td><td>B</td></tr></tbody></table>",
  col: "<table><colgroup><col></colgroup><tbody><tr><td>Célula</td></tr></tbody></table>",
  thead: "<table><thead><tr><th>Cabeçalho</th></tr></thead></table>",
  tbody: "<table><tbody><tr><td>Célula</td></tr></tbody></table>",
  tfoot: "<table><tfoot><tr><td>Rodapé</td></tr></tfoot></table>",
  tr: "<table><tbody><tr><td>Célula</td></tr></tbody></table>",
  td: "<table><tbody><tr><td>Célula</td></tr></tbody></table>",
  th: "<table><thead><tr><th>Cabeçalho</th></tr></thead></table>",
  fieldset: "<fieldset><legend>Grupo</legend></fieldset>",
  legend: "<fieldset><legend>Grupo</legend></fieldset>",
  details: "<details><summary>Resumo</summary>Conteúdo</details>",
  summary: "<details><summary>Resumo</summary>Conteúdo</details>",
  figure: `<figure>${image}<figcaption>Legenda</figcaption></figure>`,
  figcaption: `<figure>${image}<figcaption>Legenda</figcaption></figure>`,
  ruby: "<ruby>漢<rt>kan</rt></ruby>",
  rt: "<ruby>漢<rt>kan</rt></ruby>",
  rp: "<ruby>漢<rp>(</rp><rt>kan</rt><rp>)</rp></ruby>",
  rb: "<ruby><rb>漢</rb><rt>kan</rt></ruby>",
  rtc: "<ruby><rb>漢</rb><rt>kan</rt><rtc><rt>Kanji</rt></rtc></ruby>",
  picture: `<picture>${image}</picture>`,
  source: `<picture><source srcset="${placeholderImage}">${image}</picture>`,
  track:
    '<video controls style="max-width:100%"><track kind="captions" src="" label="Legenda"></video>',
  map: '<map name="mapa"><area shape="rect" coords="0,0,10,10" href="#" alt="Área"></map>',
  area: '<map name="mapa"><area shape="rect" coords="0,0,10,10" href="#" alt="Área"></map>',
  object: '<object data="" type=""></object>',
  embed: '<embed src="" type="">',
  hr: "<hr>",
  br: "<br>",
  wbr: "<wbr>",
  link: '<link rel="stylesheet" href="">',
  div: '<div style="padding:16px;border:1px dashed #a1a1aa"></div>',
  form: "<form></form>",
  script: "<script></script>",
  style: "<style></style>",
  template: "<template></template>",
  slot: "<slot></slot>",
  noscript: "<noscript>Ative o JavaScript.</noscript>",
  dialog: "<dialog>Conteúdo</dialog>",
  param: '<object data="" type=""><param name="nome" value="valor"></object>',
  h1: "<h1>Título</h1>",
};

const VOID = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "source",
  "track",
  "wbr",
]);

/** The HTML to insert for a tag of the catalog. Void elements get no content or closing tag. */
export function snippetFor(tag: string, isVoid = VOID.has(tag)): Snippet {
  const reason = NOT_IN_BODY[tag];
  if (reason) return { html: `<${tag}>`, insertable: false, reason };
  const html =
    SPECIFIC[tag] ??
    (isVoid
      ? `<${tag}>`
      : /^h[1-6]$/.test(tag)
        ? `<${tag}>Título</${tag}>`
        : `<${tag}>Texto</${tag}>`);
  return { html, insertable: true };
}
