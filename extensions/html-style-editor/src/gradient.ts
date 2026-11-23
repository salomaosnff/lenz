export type GradientType = "linear" | "radial" | "conic";
export type RadialSize = "closest-side" | "closest-corner" | "farthest-side" | "farthest-corner";

export interface Stop {
  /** Any CSS color, including `var(--x)`. */
  color: string;
  /** Percent, 0 to 100. */
  position: number;
}

export interface Gradient {
  type: GradientType;
  repeating: boolean;
  stops: Stop[];
  /** `linear`: the direction. `conic`: where it starts. Degrees. */
  angle: number;
  /** `radial` only. */
  shape: "circle" | "ellipse";
  size: RadialSize;
  /** Center, in percent: `radial` and `conic`. */
  x: number;
  y: number;
}

export const defaultGradient = (type: GradientType = "linear"): Gradient => ({
  type,
  repeating: false,
  stops: [
    { color: "#8b5cf6", position: 0 },
    { color: "#06b6d4", position: 100 },
  ],
  angle: type === "linear" ? 90 : 0,
  shape: "ellipse",
  size: "farthest-corner",
  x: 50,
  y: 50,
});

const round = (n: number) => Math.round(n * 100) / 100;

/** Splits outside of parentheses: `a(1, 2), b` -> [`a(1, 2)`, `b`]. */
function split(text: string, separator: RegExp | ","): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of text) {
    if (char === "(") depth++;
    else if (char === ")") depth = Math.max(0, depth - 1);
    const isSeparator =
      depth === 0 && (separator === "," ? char === "," : (separator as RegExp).test(char));
    if (isSeparator) {
      if (current.trim()) parts.push(current.trim());
      current = "";
    } else current += char;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

const NUMBER = "-?(?:\\d+\\.?\\d*|\\.\\d+)";
const PERCENT = new RegExp(`^(${NUMBER})%$`);
const ANGLE = new RegExp(`^(${NUMBER})(deg|turn|grad|rad)$`, "i");

function parseAngle(token: string): number | null {
  if (token === "0") return 0;
  const match = ANGLE.exec(token);
  if (!match) return null;
  const value = Number(match[1]);
  const factor = { deg: 1, turn: 360, grad: 0.9, rad: 180 / Math.PI }[match[2]!.toLowerCase()]!;
  return round(value * factor);
}

// "to corner" is approximated by the diagonal; the exact angle depends on the box.
const DIRECTIONS: Record<string, number> = {
  top: 0,
  "top right": 45,
  right: 90,
  "bottom right": 135,
  bottom: 180,
  "bottom left": 225,
  left: 270,
  "top left": 315,
};

function parseDirection(text: string): number | null {
  const words = text.toLowerCase().split(/\s+/);
  if (words[0] !== "to") return null;
  const key = words.slice(1);
  // `to right top` is the same as `to top right`.
  const normalized =
    key.length === 2 && ["left", "right"].includes(key[0]!) ? [key[1]!, key[0]!] : key;
  return DIRECTIONS[normalized.join(" ")] ?? null;
}

const SIZES = ["closest-side", "closest-corner", "farthest-side", "farthest-corner"];

function parsePosition(words: string[]): { x: number; y: number } | null {
  const horizontal: Record<string, number> = { left: 0, center: 50, right: 100 };
  const vertical: Record<string, number> = { top: 0, center: 50, bottom: 100 };
  const value = (token: string, table: Record<string, number>) => {
    if (token in table) return table[token]!;
    const percent = PERCENT.exec(token);
    return percent ? Number(percent[1]) : null;
  };
  if (words.length === 1) {
    const word = words[0]!;
    if (word in vertical && !(word in horizontal)) return { x: 50, y: vertical[word]! };
    const x = value(word, horizontal);
    return x === null ? null : { x, y: 50 };
  }
  if (words.length !== 2) return null;
  let [a, b] = words as [string, string];
  // `top left` is `left top`.
  if (a in vertical && !(a in horizontal) && (b in horizontal || PERCENT.test(b))) [a, b] = [b, a];
  const x = value(a, horizontal);
  const y = value(b, vertical);
  return x === null || y === null ? null : { x, y };
}

/** `red 10% 30%` -> two stops. `null` for what the widget cannot edit (color hints, px stops...). */
function parseStop(text: string): { color: string; positions: number[] } | null {
  const positions: number[] = [];
  const rest: string[] = [];
  for (const token of split(text, /\s/)) {
    const percent = PERCENT.exec(token);
    if (percent) positions.push(Number(percent[1]));
    else if (token === "0") positions.push(0);
    else if (new RegExp(`^${NUMBER}[a-z]+$`, "i").test(token) && !token.includes("(")) return null;
    else rest.push(token);
  }
  if (rest.length !== 1 || positions.length > 2) return null;
  return { color: rest[0]!, positions };
}

/** Gives a position to the stops that have none, the way CSS does: evenly between neighbors. */
function fillPositions(stops: { color: string; position: number | null }[]): Stop[] {
  const positions = stops.map((s) => s.position);
  if (positions[0] === null) positions[0] = 0;
  if (positions.at(-1) === null) positions[positions.length - 1] = 100;
  let previous = 0;
  for (let i = 1; i < positions.length; i++) {
    if (positions[i] === null) continue;
    const gap = i - previous;
    for (let j = previous + 1; j < i; j++) {
      positions[j] =
        positions[previous]! + ((positions[i]! - positions[previous]!) * (j - previous)) / gap;
    }
    previous = i;
  }
  return stops.map((s, i) => ({ color: s.color, position: round(positions[i]!) }));
}

/**
 * Reads one gradient. `null` when the value is something else (an image, several layers) or uses
 * what the widget does not edit (`in oklch`, `px` stops, color hints), so the caller can fall
 * back to plain text.
 */
export function parseGradient(text: string): Gradient | null {
  const match = /^(repeating-)?(linear|radial|conic)-gradient\(/i.exec(text.trim());
  if (!match) return null;
  const body = text.trim().slice(match[0].length);
  // The function must close at the very end: `a(...), url(...)` is two layers.
  let depth = 1;
  for (let i = 0; i < body.length; i++) {
    if (body[i] === "(") depth++;
    else if (body[i] === ")" && --depth === 0 && i !== body.length - 1) return null;
  }
  if (depth !== 0) return null;
  const args = split(body.slice(0, -1), ",");
  const gradient = defaultGradient(match[2]!.toLowerCase() as GradientType);
  gradient.repeating = !!match[1];
  // Without a direction CSS goes to the bottom, whatever the widget starts new gradients with.
  if (gradient.type === "linear") gradient.angle = 180;

  const first = args[0]?.toLowerCase() ?? "";
  const isStop = () => !/\bin\b/.test(first);
  if (!isStop()) return null;
  let config: string | null = null;
  if (gradient.type === "linear") {
    if (parseAngle(first) !== null || first.startsWith("to ")) config = first;
  } else if (gradient.type === "radial") {
    if (/^(circle|ellipse|closest|farthest|at\b)/.test(first)) config = first;
  } else if (/^(from|at)\b/.test(first)) config = first;
  if (config !== null) args.shift();

  if (config !== null) {
    if (gradient.type === "linear") {
      const angle = parseAngle(config) ?? parseDirection(config);
      if (angle === null) return null;
      gradient.angle = angle;
    } else {
      const [head = "", at] = config.split(/\bat\b/).map((s) => s.trim());
      const words = head.split(/\s+/).filter(Boolean);
      if (gradient.type === "conic") {
        if (words.length) {
          const angle = words[0] === "from" && words.length === 2 ? parseAngle(words[1]!) : null;
          if (angle === null) return null;
          gradient.angle = angle;
        }
      } else {
        for (const word of words) {
          if (word === "circle" || word === "ellipse") gradient.shape = word;
          else if (SIZES.includes(word)) gradient.size = word as RadialSize;
          else return null;
        }
      }
      if (at !== undefined) {
        const position = parsePosition(at.split(/\s+/).filter(Boolean));
        if (!position) return null;
        Object.assign(gradient, position);
      }
    }
  }

  const stops: { color: string; position: number | null }[] = [];
  for (const arg of args) {
    const stop = parseStop(arg);
    if (!stop) return null;
    if (stop.positions.length === 0) stops.push({ color: stop.color, position: null });
    for (const position of stop.positions) stops.push({ color: stop.color, position });
  }
  if (stops.length < 2) return null;
  gradient.stops = fillPositions(stops);
  return gradient;
}

export function formatGradient(g: Gradient): string {
  const stops = g.stops.map((s) => `${s.color} ${round(s.position)}%`).join(", ");
  const at = `at ${round(g.x)}% ${round(g.y)}%`;
  const name = `${g.repeating ? "repeating-" : ""}${g.type}-gradient`;
  const config =
    g.type === "linear"
      ? `${round(g.angle)}deg`
      : g.type === "radial"
        ? `${g.shape} ${g.size} ${at}`
        : `from ${round(g.angle)}deg ${at}`;
  return `${name}(${config}, ${stops})`;
}

/** The same colors laid out left to right, for the stops bar. */
export const barGradient = (stops: Stop[]) =>
  `linear-gradient(90deg, ${[...stops]
    .sort((a, b) => a.position - b.position)
    .map((s) => `${s.color} ${round(s.position)}%`)
    .join(", ")})`;

/** Sorted by position (stable); also tells where a given stop ended up. */
export function sortStops(stops: Stop[], track?: Stop): { stops: Stop[]; index: number } {
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  return { stops: sorted, index: track ? sorted.indexOf(track) : 0 };
}

export const reverseStops = (stops: Stop[]): Stop[] =>
  [...stops].reverse().map((s) => ({ ...s, position: round(100 - s.position) }));

/** Where the point `position` falls on the gradient, so a new stop can start from the closest color. */
export function nearestColor(stops: Stop[], position: number): string {
  return stops.reduce((best, s) =>
    Math.abs(s.position - position) < Math.abs(best.position - position) ? s : best,
  ).color;
}

export interface GradientPreset {
  label: string;
  value: string;
}

export const gradientPresets: GradientPreset[] = [
  { label: "Roxo e ciano", value: "linear-gradient(90deg, #8b5cf6 0%, #06b6d4 100%)" },
  { label: "Pôr do sol", value: "linear-gradient(135deg, #f97316 0%, #ec4899 100%)" },
  { label: "Oceano", value: "linear-gradient(180deg, #0ea5e9 0%, #1e3a8a 100%)" },
  { label: "Aurora", value: "linear-gradient(120deg, #22c55e 0%, #06b6d4 50%, #8b5cf6 100%)" },
  {
    label: "Arco-íris",
    value:
      "linear-gradient(90deg, #ef4444 0%, #f59e0b 20%, #eab308 40%, #22c55e 60%, #3b82f6 80%, #8b5cf6 100%)",
  },
  { label: "Fosco", value: "linear-gradient(180deg, rgb(0 0 0 / 0) 0%, rgb(0 0 0 / 0.7) 100%)" },
  {
    label: "Brilho",
    value:
      "radial-gradient(circle farthest-corner at 50% 50%, #fde68a 0%, #f59e0b 60%, #b45309 100%)",
  },
  {
    label: "Roda de cores",
    value:
      "conic-gradient(from 0deg at 50% 50%, #ef4444 0%, #eab308 17%, #22c55e 33%, #06b6d4 50%, #3b82f6 67%, #d946ef 83%, #ef4444 100%)",
  },
];

/**
 * Label of the preset that this gradient is, or `''`. `canonical` is the browser's own
 * serialization (it turns `#f97316` into `rgb(249, 115, 22)`), applied to both sides.
 */
export function matchGradientPreset(
  text: string,
  canonical: (value: string) => string = (value) => value,
): string {
  const key = (value: string) => {
    const gradient = parseGradient(value);
    return canonical(gradient ? formatGradient(gradient) : value.trim());
  };
  const current = key(text);
  return (current && gradientPresets.find((p) => key(p.value) === current)?.label) || "";
}
