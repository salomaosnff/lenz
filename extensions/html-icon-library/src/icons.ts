/** One icon of a set, as the Iconify JSON format keeps it. */
export interface IconData {
  /** The inside of the SVG: its paths. */
  body: string;
  /** Own size, for the icons that are not the size of the set. */
  width?: number;
  height?: number;
}

/** An alias is another name for an icon; it can also flip or turn it. */
export interface AliasData extends Partial<IconData> {
  parent: string;
  hFlip?: boolean;
  vFlip?: boolean;
  rotate?: number;
}

/** An icon set in the Iconify JSON format. */
export interface IconSet {
  width?: number;
  height?: number;
  icons: Record<string, IconData>;
  aliases?: Record<string, AliasData>;
}

export interface Icon {
  name: string;
  body: string;
  width: number;
  height: number;
}

export interface Library {
  /** Every name that can be searched for, sorted. */
  readonly names: readonly string[];
  get(name: string): Icon | undefined;
}

const DEFAULT_SIZE = 24;

/**
 * Makes a library of a set. Aliases that only rename an icon are kept; the ones that also flip or
 * turn it are left out, since the body would have to be rewritten and the original is there.
 */
export function createLibrary(set: IconSet): Library {
  const width = set.width ?? DEFAULT_SIZE;
  const height = set.height ?? DEFAULT_SIZE;
  const table = new Map<string, Icon>();
  for (const [name, data] of Object.entries(set.icons)) {
    table.set(name, {
      name,
      body: data.body,
      width: data.width ?? width,
      height: data.height ?? height,
    });
  }
  for (const [name, alias] of Object.entries(set.aliases ?? {})) {
    const parent = table.get(alias.parent);
    if (!parent || table.has(name) || alias.hFlip || alias.vFlip || alias.rotate) continue;
    table.set(name, {
      ...parent,
      name,
      width: alias.width ?? parent.width,
      height: alias.height ?? parent.height,
    });
  }
  const names = [...table.keys()].sort();
  return { names, get: (name) => table.get(name) };
}

/**
 * The names that match a search, best first: the exact name, then names that start with the text,
 * then those with a word that starts with it, then those that contain it. Several words must all
 * match (`arrow up` finds `arrow-up` and `circle-arrow-up`).
 */
export function searchNames(names: readonly string[], query: string): string[] {
  const words = query
    .toLowerCase()
    .split(/[\s-]+/)
    .filter(Boolean);
  if (!words.length) return [...names];
  const scored: { name: string; score: number }[] = [];
  for (const name of names) {
    const parts = name.split("-");
    let score = 0;
    let all = true;
    for (const word of words) {
      if (name === word) score += 0;
      else if (name.startsWith(word)) score += 1;
      else if (parts.some((p) => p.startsWith(word))) score += 2;
      else if (name.includes(word)) score += 3;
      else {
        all = false;
        break;
      }
    }
    if (all) scored.push({ name, score });
  }
  // On a tie the shorter name comes first, since it is the more general icon.
  return scored
    .sort(
      (a, b) => a.score - b.score || a.name.length - b.name.length || (a.name < b.name ? -1 : 1),
    )
    .map((s) => s.name);
}

// ---- The SVG --------------------------------------------------------------------------------------

export interface SvgOptions {
  /** Side in pixels. */
  size: number;
  /** Width of the line, for line icons. */
  strokeWidth: number;
  /** A CSS colour for the icon. Without one, the icon takes the colour of the text around it. */
  color?: string;
  /** What the icon means, for people who cannot see it. Without one, it is hidden from them. */
  label?: string;
}

export const LIMITS = { minSize: 8, maxSize: 512, minStroke: 0.5, maxStroke: 4 };
const DEFAULT_STROKE = 2;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

/** Only plain colours go into the page: hex, `rgb()`, `hsl()` and names. Anything else is dropped. */
export function safeColor(color: string | undefined): string | undefined {
  const value = color?.trim();
  if (!value) return undefined;
  return /^(#[0-9a-f]{3,8}|(rgb|hsl)a?\([\d\s.,%/-]+\)|[a-z]{3,30})$/i.test(value)
    ? value
    : undefined;
}

const escapeAttribute = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** The icon as an SVG to put in the page. It is made to size, and takes its colour from the text. */
export function renderSvg(icon: Icon, options: SvgOptions): string {
  const size = Math.round(clamp(options.size, LIMITS.minSize, LIMITS.maxSize));
  const stroke =
    Math.round(clamp(options.strokeWidth, LIMITS.minStroke, LIMITS.maxStroke) * 100) / 100;
  const body =
    stroke === DEFAULT_STROKE
      ? icon.body
      : icon.body.replace(/stroke-width="[\d.]+"/g, `stroke-width="${stroke}"`);
  // A square icon keeps its shape; a wider one is scaled by its width.
  const height = Math.round((size * icon.height) / icon.width);
  const color = safeColor(options.color);
  const label = options.label?.trim();
  const attributes = [
    'xmlns="http://www.w3.org/2000/svg"',
    `width="${size}"`,
    `height="${height}"`,
    `viewBox="0 0 ${icon.width} ${icon.height}"`,
    color ? `style="color: ${color}"` : "",
    label ? `role="img" aria-label="${escapeAttribute(label)}"` : 'aria-hidden="true"',
  ].filter(Boolean);
  return `<svg ${attributes.join(" ")}>${body}</svg>`;
}
