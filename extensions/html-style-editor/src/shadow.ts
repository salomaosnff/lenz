/** A layer of `box-shadow` or `text-shadow`. Lengths are in px. */
export interface Shadow {
  inset: boolean;
  x: number;
  y: number;
  blur: number;
  /** `box-shadow` only. */
  spread: number;
  /** Any CSS color, including `var(--x)`. */
  color: string;
}

export type ShadowKind = "box" | "text";

export const defaultShadow = (kind: ShadowKind): Shadow => ({
  inset: false,
  x: 0,
  y: kind === "box" ? 4 : 1,
  blur: kind === "box" ? 12 : 2,
  spread: 0,
  color: "rgb(0 0 0 / 0.25)",
});

/** Splits on `separator` outside of parentheses and quotes: `a(1, 2), b` -> [`a(1, 2)`, `b`]. */
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

const LENGTH = /^(-?(?:\d+\.?\d*|\.\d+))(px)?$/i;

/**
 * Reads a shadow list. `null` when it uses something the widget cannot edit (`em`, `calc()`,
 * `var()` in a length...), so the caller can fall back to the plain text field.
 */
export function parseShadows(text: string, kind: ShadowKind): Shadow[] | null {
  const trimmed = text.trim();
  if (!trimmed || trimmed === "none") return [];
  const layers: Shadow[] = [];
  for (const part of split(trimmed, ",")) {
    let inset = false;
    const lengths: number[] = [];
    const rest: string[] = [];
    for (const token of split(part, /\s/)) {
      if (token.toLowerCase() === "inset") inset = true;
      else if (LENGTH.test(token)) lengths.push(Number(LENGTH.exec(token)![1]));
      else rest.push(token);
    }
    const max = kind === "box" ? 4 : 3;
    if (lengths.length < 2 || lengths.length > max || rest.length > 1) return null;
    if (kind === "text" && inset) return null;
    const [x, y, blur = 0, spread = 0] = lengths as [number, number, number?, number?];
    layers.push({ inset, x, y, blur, spread, color: rest[0] ?? "currentcolor" });
  }
  return layers;
}

const px = (n: number) => (n === 0 ? "0" : `${Math.round(n * 100) / 100}px`);

export function formatShadows(layers: Shadow[], kind: ShadowKind): string {
  return layers
    .map((s) => {
      // Blur always, spread only when it changes anything: `0 4px 8px` rather than `0 4px 8px 0`.
      const lengths = [s.x, s.y, s.blur, ...(kind === "box" && s.spread !== 0 ? [s.spread] : [])];
      return [s.inset && kind === "box" ? "inset" : "", ...lengths.map(px), s.color]
        .filter(Boolean)
        .join(" ");
    })
    .join(", ");
}

/** Short text for a layer, e.g. `0 4px 12px`. */
export const summarize = (s: Shadow, kind: ShadowKind) =>
  formatShadows([{ ...s, color: "" }], kind);

export interface ShadowPreset {
  label: string;
  value: string;
}

export const presets: Record<ShadowKind, ShadowPreset[]> = {
  box: [
    { label: "Suave", value: "0 1px 2px rgb(0 0 0 / 0.08), 0 1px 3px rgb(0 0 0 / 0.12)" },
    { label: "Média", value: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)" },
    {
      label: "Elevada",
      value: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    },
    { label: "Interna", value: "inset 0 2px 4px rgb(0 0 0 / 0.1)" },
    { label: "Contorno", value: "0 0 0 3px rgb(59 130 246 / 0.5)" },
    { label: "Brilho", value: "0 0 16px rgb(59 130 246 / 0.6)" },
    {
      label: "Neumorfismo",
      value: "8px 8px 16px rgb(0 0 0 / 0.15), -8px -8px 16px rgb(255 255 255 / 0.7)",
    },
  ],
  text: [
    { label: "Suave", value: "0 1px 2px rgb(0 0 0 / 0.3)" },
    { label: "Elevado", value: "0 2px 4px rgb(0 0 0 / 0.35)" },
    { label: "Brilho", value: "0 0 8px rgb(59 130 246)" },
    {
      label: "Contorno",
      value: "1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000",
    },
  ],
};

/**
 * Label of the preset that this value is, or `''`.
 *
 * The browser rewrites what is stored in `style` (`rgb(0 0 0 / .1)` becomes `rgba(0, 0, 0, 0.1)`,
 * `inset` moves to the end), so both sides go through `canonical`, which should be the browser's
 * own serialization of the property. Without it only the widget's own spelling matches.
 */
export function matchPreset(
  text: string,
  kind: ShadowKind,
  canonical: (value: string) => string = (value) => value,
): string {
  const key = (value: string) => {
    const layers = parseShadows(value, kind);
    return canonical(layers ? formatShadows(layers, kind) : value.trim());
  };
  const current = key(text);
  return (current && presets[kind].find((p) => key(p.value) === current)?.label) || "";
}
