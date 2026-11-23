import { namedColors } from "./cssNamedColors";

/**
 * CSS colors: parsing, conversion between color spaces and serialization.
 * Follows CSS Color Level 4. Syntaxes that depend on the page (var(), color-mix(), relative
 * colors, light-dark(), system colors, currentcolor) are not handled here: the browser resolves
 * them (see cssColorResolve.ts) and the result is parsed with `parseColor`.
 */

export type ColorSpace =
  | "srgb"
  | "srgb-linear"
  | "display-p3"
  | "a98-rgb"
  | "prophoto-rgb"
  | "rec2020"
  | "xyz-d50"
  | "xyz-d65"
  | "hsl"
  | "hwb"
  | "lab"
  | "lch"
  | "oklab"
  | "oklch";

type Vec = [number, number, number];
type Matrix = [Vec, Vec, Vec];

/**
 * Channel values in each space's natural unit:
 * RGB-like and XYZ: 0..1 · hsl/hwb: hue in degrees, the others 0..100 · lab/lch: L 0..100 ·
 * oklab/oklch: L 0..1 · hues in degrees.
 */
export interface Color {
  space: ColorSpace;
  coords: Vec;
  /** 0..1 */
  alpha: number;
}

// ---- Linear algebra ---------------------------------------------------------------------------

const multiply = (m: Matrix, v: Vec): Vec => [
  m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
  m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
  m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
];

function multiplyMatrices(a: Matrix, b: Matrix): Matrix {
  const col = (j: number): Vec => [b[0][j], b[1][j], b[2][j]];
  const cols = [0, 1, 2].map((j) => multiply(a, col(j)));
  return [
    [cols[0]![0], cols[1]![0], cols[2]![0]],
    [cols[0]![1], cols[1]![1], cols[2]![1]],
    [cols[0]![2], cols[1]![2], cols[2]![2]],
  ];
}

function invert(m: Matrix): Matrix {
  const [[a, b, c], [d, e, f], [g, h, i]] = m;
  const A = e * i - f * h;
  const B = -(d * i - f * g);
  const C = d * h - e * g;
  const det = a * A + b * B + c * C;
  return [
    [A / det, -(b * i - c * h) / det, (b * f - c * e) / det],
    [B / det, (a * i - c * g) / det, -(a * f - c * d) / det],
    [C / det, -(a * h - b * g) / det, (a * e - b * d) / det],
  ];
}

// ---- RGB spaces ---------------------------------------------------------------------------------

type Chromaticity = [number, number];

const D65: Chromaticity = [0.3127, 0.329];
const D50: Chromaticity = [0.3457, 0.3585];

const whiteXYZ = ([x, y]: Chromaticity): Vec => [x / y, 1, (1 - x - y) / y];

/** RGB -> XYZ matrix from the primaries and the white point of the space. */
function rgbToXyzMatrix(
  primaries: [Chromaticity, Chromaticity, Chromaticity],
  white: Chromaticity,
) {
  const [r, g, b] = primaries.map(([x, y]) => whiteXYZ([x, y]));
  const primaryMatrix: Matrix = [
    [r![0], g![0], b![0]],
    [r![1], g![1], b![1]],
    [r![2], g![2], b![2]],
  ];
  const s = multiply(invert(primaryMatrix), whiteXYZ(white));
  return [
    [r![0] * s[0], g![0] * s[1], b![0] * s[2]],
    [r![1] * s[0], g![1] * s[1], b![1] * s[2]],
    [r![2] * s[0], g![2] * s[1], b![2] * s[2]],
  ] as Matrix;
}

const srgbDecode = (v: number) => {
  const a = Math.abs(v);
  return a <= 0.04045 ? v / 12.92 : Math.sign(v) * ((a + 0.055) / 1.055) ** 2.4;
};
const srgbEncode = (v: number) => {
  const a = Math.abs(v);
  return a <= 0.0031308 ? v * 12.92 : Math.sign(v) * (1.055 * a ** (1 / 2.4) - 0.055);
};
const a98Decode = (v: number) => Math.sign(v) * Math.abs(v) ** (563 / 256);
const a98Encode = (v: number) => Math.sign(v) * Math.abs(v) ** (256 / 563);
const prophotoDecode = (v: number) => {
  const a = Math.abs(v);
  return a <= 16 / 512 ? v / 16 : Math.sign(v) * a ** 1.8;
};
const prophotoEncode = (v: number) => {
  const a = Math.abs(v);
  return a >= 1 / 512 ? Math.sign(v) * a ** (1 / 1.8) : 16 * v;
};
const REC2020_ALPHA = 1.09929682680944;
const REC2020_BETA = 0.018053968510807;
const rec2020Decode = (v: number) => {
  const a = Math.abs(v);
  return a < REC2020_BETA * 4.5
    ? v / 4.5
    : Math.sign(v) * ((a + REC2020_ALPHA - 1) / REC2020_ALPHA) ** (1 / 0.45);
};
const rec2020Encode = (v: number) => {
  const a = Math.abs(v);
  return a >= REC2020_BETA
    ? Math.sign(v) * (REC2020_ALPHA * a ** 0.45 - (REC2020_ALPHA - 1))
    : 4.5 * v;
};

interface RgbSpace {
  /** Linear light -> XYZ (D65 or D50, per `white`). */
  matrix: Matrix;
  inverse: Matrix;
  white: "d65" | "d50";
  decode: (v: number) => number;
  encode: (v: number) => number;
}

const rgbSpace = (
  primaries: [Chromaticity, Chromaticity, Chromaticity],
  white: "d65" | "d50",
  decode: (v: number) => number,
  encode: (v: number) => number,
): RgbSpace => {
  const matrix = rgbToXyzMatrix(primaries, white === "d65" ? D65 : D50);
  return { matrix, inverse: invert(matrix), white, decode, encode };
};

const SRGB_PRIMARIES: [Chromaticity, Chromaticity, Chromaticity] = [
  [0.64, 0.33],
  [0.3, 0.6],
  [0.15, 0.06],
];
const identity = (v: number) => v;

const rgbSpaces: Partial<Record<ColorSpace, RgbSpace>> = {
  srgb: rgbSpace(SRGB_PRIMARIES, "d65", srgbDecode, srgbEncode),
  "srgb-linear": rgbSpace(SRGB_PRIMARIES, "d65", identity, identity),
  "display-p3": rgbSpace(
    [
      [0.68, 0.32],
      [0.265, 0.69],
      [0.15, 0.06],
    ],
    "d65",
    srgbDecode,
    srgbEncode,
  ),
  "a98-rgb": rgbSpace(
    [
      [0.64, 0.33],
      [0.21, 0.71],
      [0.15, 0.06],
    ],
    "d65",
    a98Decode,
    a98Encode,
  ),
  "prophoto-rgb": rgbSpace(
    [
      [0.7347, 0.2653],
      [0.1596, 0.8404],
      [0.0366, 0.0001],
    ],
    "d50",
    prophotoDecode,
    prophotoEncode,
  ),
  rec2020: rgbSpace(
    [
      [0.708, 0.292],
      [0.17, 0.797],
      [0.131, 0.046],
    ],
    "d65",
    rec2020Decode,
    rec2020Encode,
  ),
};

// ---- Chromatic adaptation (Bradford) ---------------------------------------------------------------

const BRADFORD: Matrix = [
  [0.8951, 0.2664, -0.1614],
  [-0.7502, 1.7135, 0.0367],
  [0.0389, -0.0685, 1.0296],
];

function adaptation(from: Vec, to: Vec): Matrix {
  const source = multiply(BRADFORD, from);
  const target = multiply(BRADFORD, to);
  const scale: Matrix = [
    [target[0] / source[0], 0, 0],
    [0, target[1] / source[1], 0],
    [0, 0, target[2] / source[2]],
  ];
  return multiplyMatrices(invert(BRADFORD), multiplyMatrices(scale, BRADFORD));
}

const WHITE_D65 = whiteXYZ(D65);
const WHITE_D50 = whiteXYZ(D50);
const D65_TO_D50 = adaptation(WHITE_D65, WHITE_D50);
const D50_TO_D65 = adaptation(WHITE_D50, WHITE_D65);

// ---- Lab, Oklab ---------------------------------------------------------------------------------------

const EPSILON = 216 / 24389;
const KAPPA = 24389 / 27;

function xyzD50ToLab(xyz: Vec): Vec {
  const f = xyz.map((v, i) => {
    const r = v / WHITE_D50[i]!;
    return r > EPSILON ? Math.cbrt(r) : (KAPPA * r + 16) / 116;
  }) as Vec;
  return [116 * f[1] - 16, 500 * (f[0] - f[1]), 200 * (f[1] - f[2])];
}

function labToXyzD50([l, a, b]: Vec): Vec {
  const f1 = (l + 16) / 116;
  const f0 = a / 500 + f1;
  const f2 = f1 - b / 200;
  const x = f0 ** 3 > EPSILON ? f0 ** 3 : (116 * f0 - 16) / KAPPA;
  const y = l > KAPPA * EPSILON ? ((l + 16) / 116) ** 3 : l / KAPPA;
  const z = f2 ** 3 > EPSILON ? f2 ** 3 : (116 * f2 - 16) / KAPPA;
  return [x * WHITE_D50[0]!, y * WHITE_D50[1]!, z * WHITE_D50[2]!];
}

const XYZ_TO_LMS: Matrix = [
  [0.819022437996703, 0.3619062600528904, -0.1288737815209879],
  [0.0329836539323885, 0.9292868615863434, 0.0361446663506424],
  [0.0481771893596242, 0.2642395317527308, 0.6335478284694309],
];
const LMS_TO_OKLAB: Matrix = [
  [0.210454268309314, 0.7936177747023054, -0.0040720430116193],
  [1.9779985324311684, -2.42859224204858, 0.450593709617411],
  [0.0259040424655478, 0.7827717124575296, -0.8086757549230774],
];
const LMS_TO_XYZ = invert(XYZ_TO_LMS);
const OKLAB_TO_LMS = invert(LMS_TO_OKLAB);

const xyzD65ToOklab = (xyz: Vec): Vec =>
  multiply(LMS_TO_OKLAB, multiply(XYZ_TO_LMS, xyz).map(Math.cbrt) as Vec);
const oklabToXyzD65 = (lab: Vec): Vec =>
  multiply(LMS_TO_XYZ, multiply(OKLAB_TO_LMS, lab).map((v) => v ** 3) as Vec);

// ---- Polar spaces and hsl/hwb ----------------------------------------------------------------------

const normalizeHue = (h: number) => ((h % 360) + 360) % 360;
const ACHROMATIC = 0.0000152587890625; // below this chroma the hue has no meaning

const rectToPolar = ([l, a, b]: Vec): Vec => {
  const c = Math.hypot(a, b);
  return [l, c, c < ACHROMATIC ? 0 : normalizeHue((Math.atan2(b, a) * 180) / Math.PI)];
};
const polarToRect = ([l, c, h]: Vec): Vec => [
  l,
  c * Math.cos((h * Math.PI) / 180),
  c * Math.sin((h * Math.PI) / 180),
];

/** sRGB 0..1 -> [h (deg), s (0..100), l (0..100)] */
function srgbToHsl([r, g, b]: Vec): Vec {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = l === 0 || l === 1 ? 0 : (max - l) / Math.min(l, 1 - l);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  if (s < 0) {
    s = -s;
    h = normalizeHue(h + 180);
  }
  return [h, s * 100, l * 100];
}

function hslToSrgb([h, s, l]: Vec): Vec {
  const hue = normalizeHue(h);
  const sat = s / 100;
  const light = l / 100;
  const f = (n: number) => {
    const k = (n + hue / 30) % 12;
    const a = sat * Math.min(light, 1 - light);
    return light - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [f(0), f(8), f(4)];
}

function srgbToHwb(rgb: Vec): Vec {
  const [h] = srgbToHsl(rgb);
  return [h, Math.min(...rgb) * 100, (1 - Math.max(...rgb)) * 100];
}

function hwbToSrgb([h, w, b]: Vec): Vec {
  const white = w / 100;
  const black = b / 100;
  if (white + black >= 1) {
    const gray = white / (white + black);
    return [gray, gray, gray];
  }
  const rgb = hslToSrgb([h, 100, 50]);
  return rgb.map((v) => v * (1 - white - black) + white) as Vec;
}

// ---- Conversion hub: XYZ D65 -----------------------------------------------------------------------------

function toXyzD65(color: Color): Vec {
  const { space, coords } = color;
  const rgb = rgbSpaces[space];
  if (rgb) {
    const xyz = multiply(rgb.matrix, coords.map(rgb.decode) as Vec);
    return rgb.white === "d50" ? multiply(D50_TO_D65, xyz) : xyz;
  }
  switch (space) {
    case "hsl":
      return toXyzD65({ space: "srgb", coords: hslToSrgb(coords), alpha: 1 });
    case "hwb":
      return toXyzD65({ space: "srgb", coords: hwbToSrgb(coords), alpha: 1 });
    case "lab":
      return multiply(D50_TO_D65, labToXyzD50(coords));
    case "lch":
      return multiply(D50_TO_D65, labToXyzD50(polarToRect(coords)));
    case "oklab":
      return oklabToXyzD65(coords);
    case "oklch":
      return oklabToXyzD65(polarToRect(coords));
    case "xyz-d50":
      return multiply(D50_TO_D65, coords);
    default:
      return coords;
  }
}

function fromXyzD65(xyz: Vec, space: ColorSpace): Vec {
  const rgb = rgbSpaces[space];
  if (rgb) {
    const linear = multiply(rgb.inverse, rgb.white === "d50" ? multiply(D65_TO_D50, xyz) : xyz);
    return linear.map(rgb.encode) as Vec;
  }
  switch (space) {
    case "hsl":
      return srgbToHsl(fromXyzD65(xyz, "srgb"));
    case "hwb":
      return srgbToHwb(fromXyzD65(xyz, "srgb"));
    case "lab":
      return xyzD50ToLab(multiply(D65_TO_D50, xyz));
    case "lch":
      return rectToPolar(xyzD50ToLab(multiply(D65_TO_D50, xyz)));
    case "oklab":
      return xyzD65ToOklab(xyz);
    case "oklch":
      return rectToPolar(xyzD65ToOklab(xyz));
    case "xyz-d50":
      return multiply(D65_TO_D50, xyz);
    default:
      return xyz;
  }
}

/** Converts a color to another space without clipping: out-of-gamut values stay out of range. */
export function convertColor(color: Color, space: ColorSpace): Color {
  if (color.space === space) return color;
  // hsl / hwb are just another way to write sRGB: skip the XYZ round trip.
  if (color.space === "hsl" && space === "srgb") {
    return { space, coords: hslToSrgb(color.coords), alpha: color.alpha };
  }
  if (color.space === "hwb" && space === "srgb") {
    return { space, coords: hwbToSrgb(color.coords), alpha: color.alpha };
  }
  if (color.space === "srgb" && space === "hsl") {
    return { space, coords: srgbToHsl(color.coords), alpha: color.alpha };
  }
  if (color.space === "srgb" && space === "hwb") {
    return { space, coords: srgbToHwb(color.coords), alpha: color.alpha };
  }
  return { space, coords: fromXyzD65(toXyzD65(color), space), alpha: color.alpha };
}

// ---- Gamut mapping -----------------------------------------------------------------------------------------

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const GAMUT_EPSILON = 0.000075;

const inSrgbGamut = ([r, g, b]: Vec) =>
  [r, g, b].every((v) => v >= -GAMUT_EPSILON && v <= 1 + GAMUT_EPSILON);

const clipSrgb = (coords: Vec): Vec => coords.map((v) => clamp(v, 0, 1)) as Vec;

const deltaEOK = (a: Vec, b: Vec) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/**
 * The color as sRGB inside the gamut (0..1). Colors outside it (wide-gamut ones) lose chroma in
 * Oklch until they fit, as in the CSS Color 4 gamut mapping algorithm, so hue and lightness hold.
 */
export function toSrgbInGamut(color: Color): Color {
  const srgb = convertColor(color, "srgb");
  if (inSrgbGamut(srgb.coords)) return { ...srgb, coords: clipSrgb(srgb.coords) };

  const origin = convertColor(color, "oklch").coords;
  if (origin[0] >= 1) return { space: "srgb", coords: [1, 1, 1], alpha: color.alpha };
  if (origin[0] <= 0) return { space: "srgb", coords: [0, 0, 0], alpha: color.alpha };

  const JND = 0.02;
  const PRECISION = 0.0001;
  const asSrgb = (c: number) =>
    convertColor({ space: "oklch", coords: [origin[0], c, origin[2]], alpha: 1 }, "srgb").coords;
  let min = 0;
  let max = origin[1];
  let minInGamut = true;
  let clipped = clipSrgb(srgb.coords);
  while (max - min > PRECISION) {
    const chroma = (min + max) / 2;
    const current = asSrgb(chroma);
    if (minInGamut && inSrgbGamut(current)) {
      min = chroma;
      continue;
    }
    clipped = clipSrgb(current);
    const error = deltaEOK(
      convertColor({ space: "srgb", coords: clipped, alpha: 1 }, "oklab").coords,
      convertColor({ space: "srgb", coords: current, alpha: 1 }, "oklab").coords,
    );
    if (error < JND) {
      if (JND - error < PRECISION) break;
      minInGamut = false;
      min = chroma;
    } else {
      max = chroma;
    }
  }
  return { space: "srgb", coords: clipped, alpha: color.alpha };
}

// ---- Parsing -------------------------------------------------------------------------------------------------

const rgbSpaceNames = new Set<string>([
  "srgb",
  "srgb-linear",
  "display-p3",
  "a98-rgb",
  "prophoto-rgb",
  "rec2020",
]);

/** One channel: a number, a percentage or `none`. */
function channel(
  token: string,
  percentOf: number,
  kind: "number" | "hue" = "number",
): number | null {
  const t = token.toLowerCase();
  if (t === "none") return 0;
  if (kind === "hue") {
    const angle = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(deg|grad|rad|turn)?$/.exec(t);
    if (!angle) return null;
    const n = Number(angle[1]);
    const unit = angle[2];
    return unit === "grad"
      ? n * 0.9
      : unit === "rad"
        ? (n * 180) / Math.PI
        : unit === "turn"
          ? n * 360
          : n;
  }
  const m = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(%)?$/.exec(t);
  if (!m) return null;
  const n = Number(m[1]);
  return m[2] ? (n / 100) * percentOf : n;
}

function alphaOf(token: string | undefined): number | null {
  if (token === undefined) return 1;
  const a = channel(token, 1);
  return a === null ? null : clamp(a, 0, 1);
}

/** Splits the inside of a function into channels and the alpha (after "/" or as a 4th legacy value). */
function splitArguments(
  inner: string,
  legacyAlpha: boolean,
): { channels: string[]; alpha?: string } | null {
  if (inner.includes("(")) return null; // calc(), var(), nested colors...: the browser resolves these
  const slash = inner.split("/");
  if (slash.length > 2) return null;
  const channels = slash[0]!
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean);
  const alpha = slash[1]?.trim();
  if (alpha !== undefined) return alpha ? { channels, alpha } : null;
  // Legacy syntax: rgba(1, 2, 3, 0.5)
  if (legacyAlpha && channels.length === 4)
    return { channels: channels.slice(0, 3), alpha: channels[3] };
  return { channels };
}

function parseHex(hex: string): Color | null {
  if (!/^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(hex)) return null;
  let digits = hex.slice(1);
  if (digits.length <= 4) digits = [...digits].map((d) => d + d).join("");
  const n = (i: number) => parseInt(digits.slice(i, i + 2), 16) / 255;
  return {
    space: "srgb",
    coords: [n(0), n(2), n(4)],
    alpha: digits.length === 8 ? n(6) : 1,
  };
}

/**
 * Parses a CSS color written with a static syntax: hex, named colors, `transparent`, rgb(), hsl(),
 * hwb(), lab(), lch(), oklab(), oklch() and color(). Returns `null` for anything else
 * (var(), color-mix(), relative colors, system colors, currentcolor...) and for invalid text.
 */
export function parseColor(input: string): Color | null {
  const text = input.trim().toLowerCase();
  if (!text) return null;
  if (text.startsWith("#")) return parseHex(text);
  if (text === "transparent") return { space: "srgb", coords: [0, 0, 0], alpha: 0 };
  if (Object.hasOwn(namedColors, text)) return parseHex(namedColors[text]!);

  const fn = /^([a-z-]+)\(([\s\S]*)\)$/.exec(text);
  if (!fn) return null;
  const name = fn[1]!;
  const args = splitArguments(fn[2]!, name !== "color");
  if (!args) return null;
  const { channels } = args;
  const alpha = alphaOf(args.alpha);
  if (alpha === null) return null;

  const make = (space: ColorSpace, coords: (number | null)[]): Color | null =>
    coords.length === 3 && coords.every((v) => v !== null && Number.isFinite(v))
      ? { space, coords: coords as Vec, alpha }
      : null;

  if (name === "color") {
    let [space, ...rest] = channels;
    if (!space || rest.length !== 3) return null;
    if (space === "xyz") space = "xyz-d65";
    if (!rgbSpaceNames.has(space) && space !== "xyz-d50" && space !== "xyz-d65") return null;
    return make(
      space as ColorSpace,
      rest.map((t) => channel(t, 1)),
    );
  }
  if (channels.length !== 3) return null;
  const [c1, c2, c3] = channels as [string, string, string];
  switch (name) {
    case "rgb":
    case "rgba": {
      const rgb = [c1, c2, c3].map((t) => channel(t, 255));
      return make(
        "srgb",
        rgb.map((v) => (v === null ? null : v / 255)),
      );
    }
    case "hsl":
    case "hsla":
      return make("hsl", [channel(c1, 0, "hue"), channel(c2, 100), channel(c3, 100)]);
    case "hwb":
      return make("hwb", [channel(c1, 0, "hue"), channel(c2, 100), channel(c3, 100)]);
    case "lab":
      return make("lab", [channel(c1, 100), channel(c2, 125), channel(c3, 125)]);
    case "lch":
      return make("lch", [channel(c1, 100), channel(c2, 150), channel(c3, 0, "hue")]);
    case "oklab":
      return make("oklab", [channel(c1, 1), channel(c2, 0.4), channel(c3, 0.4)]);
    case "oklch":
      return make("oklch", [channel(c1, 1), channel(c2, 0.4), channel(c3, 0, "hue")]);
    default:
      return null;
  }
}

// ---- Formatting ----------------------------------------------------------------------------------------------

export type ColorFormat =
  | "hex"
  | "name"
  | "rgb"
  | "hsl"
  | "hwb"
  | "lab"
  | "lch"
  | "oklab"
  | "oklch"
  | "srgb"
  | "srgb-linear"
  | "display-p3"
  | "a98-rgb"
  | "prophoto-rgb"
  | "rec2020"
  | "xyz-d50"
  | "xyz-d65";

export const colorFormats: { id: ColorFormat; label: string }[] = [
  { id: "hex", label: "HEX" },
  { id: "rgb", label: "RGB" },
  { id: "hsl", label: "HSL" },
  { id: "hwb", label: "HWB" },
  { id: "lab", label: "LAB" },
  { id: "lch", label: "LCH" },
  { id: "oklab", label: "OKLAB" },
  { id: "oklch", label: "OKLCH" },
  { id: "srgb", label: "sRGB" },
  { id: "srgb-linear", label: "sRGB linear" },
  { id: "display-p3", label: "Display P3" },
  { id: "a98-rgb", label: "A98 RGB" },
  { id: "prophoto-rgb", label: "ProPhoto RGB" },
  { id: "rec2020", label: "Rec. 2020" },
  { id: "xyz-d50", label: "XYZ D50" },
  { id: "xyz-d65", label: "XYZ D65" },
  { id: "name", label: "Nome" },
];

/** The color space whose channels a format shows. */
export const formatSpace = (format: ColorFormat): ColorSpace =>
  format === "hex" || format === "name" || format === "rgb" ? "srgb" : (format as ColorSpace);

/** Editable channels of each format, for the numeric fields. */
export interface ChannelInfo {
  label: string;
  min?: number;
  max?: number;
  step: number;
}

export function formatChannels(format: ColorFormat): ChannelInfo[] {
  switch (format) {
    case "rgb":
      return [
        { label: "R", min: 0, max: 255, step: 1 },
        { label: "G", min: 0, max: 255, step: 1 },
        { label: "B", min: 0, max: 255, step: 1 },
      ];
    case "hsl":
      return [
        { label: "H", min: 0, max: 360, step: 1 },
        { label: "S", min: 0, max: 100, step: 1 },
        { label: "L", min: 0, max: 100, step: 1 },
      ];
    case "hwb":
      return [
        { label: "H", min: 0, max: 360, step: 1 },
        { label: "W", min: 0, max: 100, step: 1 },
        { label: "B", min: 0, max: 100, step: 1 },
      ];
    case "lab":
      return [
        { label: "L", min: 0, max: 100, step: 1 },
        { label: "a", step: 1 },
        { label: "b", step: 1 },
      ];
    case "lch":
      return [
        { label: "L", min: 0, max: 100, step: 1 },
        { label: "C", min: 0, step: 1 },
        { label: "H", min: 0, max: 360, step: 1 },
      ];
    case "oklab":
      return [
        { label: "L", min: 0, max: 1, step: 0.01 },
        { label: "a", step: 0.01 },
        { label: "b", step: 0.01 },
      ];
    case "oklch":
      return [
        { label: "L", min: 0, max: 1, step: 0.01 },
        { label: "C", min: 0, step: 0.01 },
        { label: "H", min: 0, max: 360, step: 1 },
      ];
    case "xyz-d50":
    case "xyz-d65":
      return [
        { label: "X", step: 0.01 },
        { label: "Y", step: 0.01 },
        { label: "Z", step: 0.01 },
      ];
    default:
      return [
        { label: "R", min: 0, max: 1, step: 0.01 },
        { label: "G", min: 0, max: 1, step: 0.01 },
        { label: "B", min: 0, max: 1, step: 0.01 },
      ];
  }
}

/** Number of decimals shown for a format's channels. */
const decimals = (format: ColorFormat): [number, number, number] => {
  switch (format) {
    case "hsl":
    case "hwb":
      return [1, 1, 1];
    case "lab":
    case "lch":
      return [2, 2, 2];
    case "oklab":
      return [4, 4, 4];
    case "oklch":
      return [4, 4, 2];
    default:
      return [4, 4, 4];
  }
};

const round = (v: number, places: number) => {
  const p = 10 ** places;
  const r = Math.round(v * p) / p;
  return Object.is(r, -0) ? 0 : r;
};

/** Number as shown to the user: rounded and without trailing zeros. */
const num = (v: number, places: number) => String(round(v, places));

const alphaText = (alpha: number) => (alpha >= 1 ? "" : ` / ${num(alpha, 3)}`);

const hex2 = (v: number) =>
  Math.round(clamp(v, 0, 1) * 255)
    .toString(16)
    .padStart(2, "0");

const hexOf = (color: Color) => {
  const [r, g, b] = toSrgbInGamut(color).coords;
  const a = color.alpha < 1 ? hex2(color.alpha) : "";
  return `#${hex2(r)}${hex2(g)}${hex2(b)}${a}`;
};

const nameByHex = new Map<string, string>();
for (const [name, hex] of Object.entries(namedColors))
  if (!nameByHex.has(hex)) nameByHex.set(hex, name);

/** Name of the CSS named color that is exactly this color, if any. */
export function colorName(color: Color): string | null {
  if (color.alpha === 0) return "transparent";
  if (color.alpha !== 1) return null;
  const hex = hexOf(color);
  return nameByHex.get(hex) ?? null;
}

/** Serializes a color in the given format. Legacy formats (hex, rgb, hsl, hwb, name) are clamped to sRGB. */
export function formatColor(color: Color, format: ColorFormat): string {
  if (format === "hex") return hexOf(color);
  if (format === "name") return colorName(color) ?? hexOf(color);

  const legacy = format === "rgb" || format === "hsl" || format === "hwb";
  const source = legacy ? toSrgbInGamut(color) : color;
  const space = formatSpace(format);
  const coords = convertColor(source, space).coords;
  const [p0, p1, p2] = decimals(format);
  const a = alphaText(color.alpha);

  switch (format) {
    case "rgb": {
      const [r, g, b] = coords.map((v) => Math.round(clamp(v, 0, 1) * 255));
      return `rgb(${r} ${g} ${b}${a})`;
    }
    case "hsl":
      return `hsl(${num(coords[0], p0)} ${num(coords[1], p1)}% ${num(coords[2], p2)}%${a})`;
    case "hwb":
      return `hwb(${num(coords[0], p0)} ${num(coords[1], p1)}% ${num(coords[2], p2)}%${a})`;
    case "lab":
    case "lch":
    case "oklab":
    case "oklch":
      return `${format}(${num(coords[0], p0)} ${num(coords[1], p1)} ${num(coords[2], p2)}${a})`;
    default:
      return `color(${format} ${num(coords[0], p0)} ${num(coords[1], p1)} ${num(coords[2], p2)}${a})`;
  }
}

/** The format a color string is written in (what the picker starts with). */
export function detectFormat(text: string): ColorFormat {
  const t = text.trim().toLowerCase();
  if (t.startsWith("#")) return "hex";
  const fn = /^([a-z-]+)\(/.exec(t)?.[1];
  if (!fn) return Object.hasOwn(namedColors, t) ? "name" : "hex";
  if (fn === "rgba") return "rgb";
  if (fn === "hsla") return "hsl";
  if (fn === "color") {
    const space = /^color\(\s*([a-z0-9-]+)/.exec(t)?.[1];
    return space === "xyz"
      ? "xyz-d65"
      : colorFormats.some((f) => f.id === space)
        ? (space as ColorFormat)
        : "hex";
  }
  return colorFormats.some((f) => f.id === fn) ? (fn as ColorFormat) : "hex";
}

// ---- HSV, for the picker area ------------------------------------------------------------------------------------

export interface Hsv {
  /** degrees */
  h: number;
  /** 0..1 */
  s: number;
  /** 0..1 */
  v: number;
}

export function srgbToHsv([r, g, b]: Vec, previousHue = 0): Hsv {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = previousHue; // greys have no hue: keep the one the user was on
  if (d > 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

export function hsvToSrgb({ h, s, v }: Hsv): Vec {
  const f = (n: number) => {
    const k = (n + normalizeHue(h) / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return [f(5), f(3), f(1)];
}
