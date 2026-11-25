export interface Rgba {
  r: number;
  g: number;
  b: number;
  /** 0 (invisible) to 1 (opaque). */
  a: number;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** Reads what the browser gives back for a computed colour: `rgb()`, `rgba()` or `color(srgb ...)`. */
export function parseComputed(text: string): Rgba | undefined {
  const numbers = text.match(/-?\d*\.?\d+(?:e-?\d+)?%?/g);
  if (!numbers || numbers.length < 3) return undefined;
  const srgb = /^\s*color\(\s*srgb/i.test(text);
  const [r, g, b] = numbers.slice(0, 3).map((n) => {
    const value = Number.parseFloat(n);
    return srgb ? value * 255 : n.endsWith("%") ? (value / 100) * 255 : value;
  }) as [number, number, number];
  const alpha = numbers[3];
  const a = alpha === undefined ? 1 : Number.parseFloat(alpha) / (alpha.endsWith("%") ? 100 : 1);
  return { r: Math.round(r), g: Math.round(g), b: Math.round(b), a: clamp(a, 0, 1) };
}

export function hslToRgb(h: number, s: number, l: number): Pick<Rgba, "r" | "g" | "b"> {
  const sat = s / 100;
  const light = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(light, 1 - light);
  const f = (n: number) => light - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) };
}

/** Hue in degrees (0–360), saturation and lightness in percent. */
export function rgbToHsl({ r, g, b }: Pick<Rgba, "r" | "g" | "b">) {
  const [R, G, B] = [r / 255, g / 255, b / 255];
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l: l * 100 };
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === R ? ((G - B) / d) % 6 : max === G ? (B - R) / d + 2 : (R - G) / d + 4;
  return { h: (h * 60 + 360) % 360, s: s * 100, l: l * 100 };
}

/** Reads hex, `rgb()` and `hsl()` without a browser. Names need the browser, so they are not here. */
export function parseColor(text: string): Rgba | undefined {
  const value = text.trim().toLowerCase();
  const hex = /^#([0-9a-f]{3,8})$/.exec(value)?.[1];
  if (hex && [3, 6, 8].includes(hex.length)) {
    const full =
      hex.length === 3
        ? hex
            .split("")
            .map((c) => c + c)
            .join("")
        : hex;
    const [r, g, b, a] = [0, 2, 4, 6].map((i) => Number.parseInt(full.slice(i, i + 2), 16));
    return { r: r!, g: g!, b: b!, a: a === undefined || Number.isNaN(a) ? 1 : a / 255 };
  }
  if (/^rgba?\(/.test(value)) return parseComputed(value);
  if (/^hsla?\(/.test(value)) {
    const n = value.match(/-?\d*\.?\d+/g)?.map((x) => Number.parseFloat(x));
    if (!n || n.length < 3) return undefined;
    // An alpha written as a percentage ends the function: `hsl(0 100% 50% / 50%)`.
    const a = n[3] === undefined ? 1 : value.endsWith("%)") ? n[3] / 100 : n[3];
    return { ...hslToRgb(n[0]!, n[1]!, n[2]!), a: clamp(a, 0, 1) };
  }
  return undefined;
}

// ---- How the player wrote it ---------------------------------------------------------------------

export type Format = "named" | "hex" | "hex3" | "rgb" | "hsl" | "other";

export const FORMAT_LABEL: Record<Format, string> = {
  named: "um nome (como red)",
  hex: "hexadecimal de 6 dígitos (#rrggbb)",
  hex3: "hexadecimal de 3 dígitos (#rgb)",
  rgb: "rgb()",
  hsl: "hsl()",
  other: "outro formato",
};

const KEYWORDS = new Set(["inherit", "initial", "unset", "revert", "currentcolor"]);

export function detectFormat(text: string): Format {
  const value = text.trim();
  if (/^#[0-9a-f]{3}$/i.test(value)) return "hex3";
  if (/^#[0-9a-f]{6}$/i.test(value)) return "hex";
  if (/^rgba?\(/i.test(value)) return "rgb";
  if (/^hsla?\(/i.test(value)) return "hsl";
  if (/^[a-z]+$/i.test(value) && !KEYWORDS.has(value.toLowerCase())) return "named";
  return "other";
}

// ---- Contrast (WCAG) ---------------------------------------------------------------------------------

/** Puts a colour with transparency on top of an opaque one. */
export function over(top: Rgba, bottom: Rgba): Rgba {
  const mix = (t: number, b: number) => Math.round(t * top.a + b * (1 - top.a));
  return { r: mix(top.r, bottom.r), g: mix(top.g, bottom.g), b: mix(top.b, bottom.b), a: 1 };
}

export function luminance({ r, g, b }: Pick<Rgba, "r" | "g" | "b">): number {
  const [R, G, B] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/** 1 (no contrast) to 21 (black on white). */
export function contrastRatio(foreground: Rgba, background: Rgba): number {
  const top = luminance(over(foreground, background));
  const bottom = luminance(background);
  const [hi, lo] = top > bottom ? [top, bottom] : [bottom, top];
  return (hi + 0.05) / (lo + 0.05);
}

// ---- Hints, channel by channel -------------------------------------------------------------------

export interface Hint {
  label: string;
  /** `up`: the target has more of it. `down`: less. */
  state: "ok" | "up" | "down";
}

const state = (diff: number, tolerance: number): Hint["state"] =>
  Math.abs(diff) <= tolerance ? "ok" : diff > 0 ? "up" : "down";

/**
 * Compares the player's colour with the target, one channel at a time (red, green, blue, or hue,
 * saturation, lightness), so the player knows which way to go instead of guessing.
 */
export function colorHints(
  player: Rgba,
  target: Rgba,
  mode: "rgb" | "hsl",
  withAlpha: boolean,
  tolerance: number,
): Hint[] {
  const hints: Hint[] =
    mode === "rgb"
      ? [
          { label: "Vermelho", state: state(target.r - player.r, tolerance) },
          { label: "Verde", state: state(target.g - player.g, tolerance) },
          { label: "Azul", state: state(target.b - player.b, tolerance) },
        ]
      : (() => {
          const p = rgbToHsl(player);
          const t = rgbToHsl(target);
          // The hue is a circle: 350° and 10° are close, so take the short way round.
          const hue = ((t.h - p.h + 540) % 360) - 180;
          return [
            { label: "Matiz", state: state(hue, tolerance) },
            { label: "Saturação", state: state(t.s - p.s, tolerance) },
            { label: "Luminosidade", state: state(t.l - p.l, tolerance) },
          ] as Hint[];
        })();
  if (withAlpha) hints.push({ label: "Transparência", state: state(target.a - player.a, 0.04) });
  return hints;
}
