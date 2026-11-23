export interface StyleField {
  prop: string;
  label: string;
  /** When set, the field is a select with these values. */
  options?: string[];
  /** Free-text fields: common values offered as suggestions. */
  suggestions?: string[];
  /** `color` fields use the color picker. */
  type?: "color" | "shadow" | "gradient";
  /** For a shorthand: its longhands, shown when the row is expanded. */
  children?: StyleField[];
}

/** top/right/bottom/left longhands of a shorthand (`margin` -> `margin-top`...; `''` -> `top`...). */
export const sides = (prefix: string): StyleField[] =>
  [
    ["top", "Topo"],
    ["right", "Direita"],
    ["bottom", "Base"],
    ["left", "Esquerda"],
  ].map(([side, label]) => ({ prop: prefix ? `${prefix}-${side}` : side!, label: label! }));

export interface StyleGroup {
  id: string;
  label: string;
  fields: StyleField[];
}

/** How a background image is placed. They also shape a gradient, which is an image too. */
export const backgroundOptionFields: StyleField[] = [
  {
    prop: "background-size",
    label: "Tamanho",
    suggestions: ["auto", "cover", "contain", "50%", "100% 100%", "200px auto"],
  },
  {
    prop: "background-position",
    label: "Posição",
    suggestions: [
      "center",
      "top",
      "bottom",
      "left",
      "right",
      "top left",
      "top right",
      "bottom left",
      "bottom right",
      "50% 50%",
    ],
  },
  {
    prop: "background-repeat",
    label: "Repetição",
    options: ["", "repeat", "no-repeat", "repeat-x", "repeat-y"],
  },
  {
    prop: "background-attachment",
    label: "Fixação",
    options: ["", "scroll", "fixed", "local"],
  },
  {
    prop: "background-origin",
    label: "Origem",
    options: ["", "padding-box", "border-box", "content-box"],
  },
  {
    prop: "background-blend-mode",
    label: "Mistura",
    options: [
      "",
      "normal",
      "multiply",
      "screen",
      "overlay",
      "darken",
      "lighten",
      "color-dodge",
      "color-burn",
      "hard-light",
      "soft-light",
      "difference",
      "exclusion",
      "hue",
      "saturation",
      "color",
      "luminosity",
    ],
  },
];

/** Style fields grouped like the sections of a design tool's inspector. */
export const styleGroups: StyleGroup[] = [
  // Its controls depend on `display`, so the layout view builds its own fields (LayoutView.vue).
  { id: "layout", label: "Layout", fields: [] },
  {
    id: "spacing",
    label: "Espaçamento",
    fields: [
      { prop: "margin", label: "Margem", children: sides("margin") },
      { prop: "padding", label: "Espaçamento interno", children: sides("padding") },
    ],
  },
  {
    id: "typography",
    label: "Tipografia",
    fields: [
      { prop: "font-family", label: "Fonte" },
      { prop: "font-size", label: "Tamanho" },
      {
        prop: "font-weight",
        label: "Peso",
        options: [
          "",
          "normal",
          "bold",
          "100",
          "200",
          "300",
          "400",
          "500",
          "600",
          "700",
          "800",
          "900",
        ],
      },
      { prop: "font-style", label: "Estilo", options: ["", "normal", "italic"] },
      { prop: "line-height", label: "Altura da linha" },
      { prop: "letter-spacing", label: "Espaço entre letras" },
      {
        prop: "text-align",
        label: "Alinhamento",
        options: ["", "left", "center", "right", "justify"],
      },
      {
        prop: "text-decoration",
        label: "Decoração",
        options: ["", "none", "underline", "line-through", "overline"],
      },
      { prop: "color", label: "Cor do texto", type: "color" },
      { prop: "text-gradient", label: "Degradê do texto", type: "gradient" },
    ],
  },
  {
    id: "background",
    label: "Fundo",
    fields: [
      { prop: "background-color", label: "Cor", type: "color" },
      { prop: "background-image", label: "Imagem / degradê", type: "gradient" },
      ...backgroundOptionFields,
    ],
  },
  {
    id: "border",
    label: "Borda",
    fields: [
      {
        prop: "border",
        label: "Borda",
        children: [
          { prop: "border-width", label: "Espessura" },
          {
            prop: "border-style",
            label: "Estilo",
            options: ["", "none", "solid", "dashed", "dotted", "double", "groove", "ridge"],
          },
          { prop: "border-color", label: "Cor", type: "color" },
        ],
      },
      {
        prop: "border-radius",
        label: "Arredondamento",
        children: [
          { prop: "border-top-left-radius", label: "Topo esquerdo" },
          { prop: "border-top-right-radius", label: "Topo direito" },
          { prop: "border-bottom-right-radius", label: "Base direita" },
          { prop: "border-bottom-left-radius", label: "Base esquerda" },
        ],
      },
    ],
  },
  {
    id: "effects",
    label: "Efeitos",
    fields: [
      { prop: "opacity", label: "Opacidade" },
      { prop: "box-shadow", label: "Sombra", type: "shadow" },
      { prop: "text-shadow", label: "Sombra do texto", type: "shadow" },
    ],
  },
];
