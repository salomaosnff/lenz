/** Human names for the values of select fields; the CSS value is shown next to them. */
const generic: Record<string, string> = {
  // display
  block: "Bloco",
  inline: "Em linha",
  "inline-block": "Bloco em linha",
  "flow-root": "Raiz de fluxo",
  flex: "Flexível",
  "inline-flex": "Flexível em linha",
  grid: "Grade",
  "inline-grid": "Grade em linha",
  contents: "Conteúdo",
  none: "Nenhum",
  // flex and grid
  row: "Linha",
  "row-reverse": "Linha invertida",
  column: "Coluna",
  "column-reverse": "Coluna invertida",
  nowrap: "Sem quebra",
  wrap: "Quebrar",
  "wrap-reverse": "Quebrar invertido",
  dense: "Denso",
  "row dense": "Linha densa",
  "column dense": "Coluna densa",
  // alignment
  "flex-start": "Início",
  start: "Início",
  center: "Centro",
  "flex-end": "Fim",
  end: "Fim",
  "space-between": "Espaço entre",
  "space-around": "Espaço ao redor",
  "space-evenly": "Espaço igual",
  stretch: "Esticar",
  baseline: "Linha de base",
  auto: "Automático",
  normal: "Normal",
  // text
  bold: "Negrito",
  italic: "Itálico",
  left: "Esquerda",
  right: "Direita",
  justify: "Justificado",
  underline: "Sublinhado",
  "line-through": "Tachado",
  overline: "Sobrelinha",
  // overflow
  visible: "Visível",
  hidden: "Oculto",
  clip: "Cortar",
  scroll: "Rolar",
  // background
  cover: "Cobrir",
  contain: "Conter",
  repeat: "Repetir",
  "no-repeat": "Não repetir",
  "repeat-x": "Repetir na horizontal",
  "repeat-y": "Repetir na vertical",
  // box and position
  "content-box": "Caixa do conteúdo",
  "border-box": "Caixa da borda",
  static: "Estática",
  relative: "Relativa",
  absolute: "Absoluta",
  fixed: "Fixa",
  sticky: "Fixa ao rolar",
  // background placement and blending
  local: "Local",
  "padding-box": "Caixa do preenchimento",
  multiply: "Multiplicar",
  screen: "Tela",
  overlay: "Sobrepor",
  darken: "Escurecer",
  lighten: "Clarear",
  "color-dodge": "Subexposição de cor",
  "color-burn": "Superexposição de cor",
  "hard-light": "Luz direta",
  "soft-light": "Luz suave",
  difference: "Diferença",
  exclusion: "Exclusão",
  hue: "Matiz",
  saturation: "Saturação",
  color: "Cor",
  luminosity: "Luminosidade",
  // border
  solid: "Sólida",
  dashed: "Tracejada",
  dotted: "Pontilhada",
  double: "Dupla",
  groove: "Sulco",
  ridge: "Relevo",
};

/** Where the same value means something else for one property. */
const byProp: Record<string, Record<string, string>> = {
  "font-weight": {
    "100": "Fina",
    "200": "Extra leve",
    "300": "Leve",
    "400": "Normal",
    "500": "Média",
    "600": "Seminegrito",
    "700": "Negrito",
    "800": "Extranegrito",
    "900": "Preta",
  },
};

/** `Grade (grid)`; the bare value when there is no name for it, `—` for the empty choice. */
export function optionLabel(prop: string, value: string): string {
  if (!value) return "—";
  const name = byProp[prop]?.[value] ?? generic[value];
  return name ? `${name} (${value})` : value;
}

export const hasOptionLabel = (prop: string, value: string) =>
  !value || !!(byProp[prop]?.[value] ?? generic[value]);
