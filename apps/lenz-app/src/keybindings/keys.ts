/** One key press with its modifiers. */
export interface Chord {
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
  /** Lowercase name: `a`, `5`, `f2`, `space`, `enter`, `escape`, `arrowup`, `,`... */
  key: string;
}

export const isMac = () =>
  typeof navigator !== "undefined" && /mac|iphone|ipad/i.test(navigator.platform);

const ALIASES: Record<string, string> = {
  esc: "escape",
  return: "enter",
  del: "delete",
  ins: "insert",
  up: "arrowup",
  down: "arrowdown",
  left: "arrowleft",
  right: "arrowright",
  pgup: "pageup",
  pgdn: "pagedown",
  spacebar: "space",
  plus: "+",
  comma: ",",
  period: ".",
  minus: "-",
};

const NAMED = new Set([
  "space",
  "enter",
  "escape",
  "tab",
  "backspace",
  "delete",
  "insert",
  "home",
  "end",
  "pageup",
  "pagedown",
  "arrowup",
  "arrowdown",
  "arrowleft",
  "arrowright",
]);
const PUNCTUATION = new Set([",", ".", "/", ";", "'", "[", "]", "\\", "-", "=", "`", "+"]);

function normalizeKey(raw: string): string | null {
  const key = ALIASES[raw.toLowerCase()] ?? raw.toLowerCase();
  if (/^[a-z0-9]$/.test(key) || /^f([1-9]|1\d|2[0-4])$/.test(key)) return key;
  return NAMED.has(key) || PUNCTUATION.has(key) ? key : null;
}

/**
 * Reads `Ctrl+Shift+P` or a sequence such as `Ctrl+K Ctrl+O`. `Mod` is Cmd on a Mac and Ctrl
 * elsewhere, so one binding serves both. Throws on anything it does not understand.
 */
export function parseKey(text: string, mac = isMac()): Chord[] {
  const steps = text.trim().split(/\s+/).filter(Boolean);
  if (!steps.length) throw new Error("A keybinding needs a key.");
  return steps.map((step) => {
    const parts = step.split("+");
    // `Ctrl++` ends in an empty part: the key is the plus sign itself.
    const key = parts.at(-1) === "" ? "+" : parts.pop()!;
    if (parts.at(-1) === "") parts.pop();
    const chord: Chord = { ctrl: false, alt: false, shift: false, meta: false, key: "" };
    for (const modifier of parts.filter(Boolean)) {
      const name = modifier.toLowerCase();
      if (name === "ctrl" || name === "control") chord.ctrl = true;
      else if (name === "alt" || name === "option") chord.alt = true;
      else if (name === "shift") chord.shift = true;
      else if (name === "meta" || name === "cmd" || name === "win" || name === "super")
        chord.meta = true;
      else if (name === "mod") mac ? (chord.meta = true) : (chord.ctrl = true);
      else throw new Error(`Unknown modifier "${modifier}" in "${text}".`);
    }
    const normalized = normalizeKey(key);
    if (!normalized) throw new Error(`Unknown key "${key}" in "${text}".`);
    chord.key = normalized;
    return chord;
  });
}

const CODES: Record<string, string> = {
  Space: "space",
  Enter: "enter",
  NumpadEnter: "enter",
  Escape: "escape",
  Tab: "tab",
  Backspace: "backspace",
  Delete: "delete",
  Insert: "insert",
  Home: "home",
  End: "end",
  PageUp: "pageup",
  PageDown: "pagedown",
  ArrowUp: "arrowup",
  ArrowDown: "arrowdown",
  ArrowLeft: "arrowleft",
  ArrowRight: "arrowright",
  Comma: ",",
  Period: ".",
  Slash: "/",
  Semicolon: ";",
  Quote: "'",
  BracketLeft: "[",
  BracketRight: "]",
  Backslash: "\\",
  Minus: "-",
  Equal: "=",
  Backquote: "`",
};

export interface KeyLike {
  key: string;
  code: string;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
}

/** The chord of a keydown, or `null` for a modifier pressed alone. Letters use the physical key. */
export function chordOf(event: KeyLike): Chord | null {
  if (["Control", "Alt", "Shift", "Meta", "AltGraph"].includes(event.key)) return null;
  const letter = /^Key([A-Z])$/.exec(event.code);
  const digit = /^Digit(\d)$/.exec(event.code);
  const key = letter
    ? letter[1]!.toLowerCase()
    : digit
      ? digit[1]!
      : /^F\d+$/.test(event.code)
        ? event.code.toLowerCase()
        : (CODES[event.code] ?? normalizeKey(event.key));
  if (!key) return null;
  return {
    ctrl: event.ctrlKey,
    alt: event.altKey,
    shift: event.shiftKey,
    meta: event.metaKey,
    key,
  };
}

export const sameChord = (a: Chord, b: Chord) =>
  a.key === b.key &&
  a.ctrl === b.ctrl &&
  a.alt === b.alt &&
  a.shift === b.shift &&
  a.meta === b.meta;

/** Whether `prefix` is the start of `chords` (the whole of it counts). */
export const startsWith = (chords: Chord[], prefix: Chord[]) =>
  prefix.length <= chords.length && prefix.every((chord, i) => sameChord(chord, chords[i]!));

/** The text `parseKey` reads back: `Ctrl+Shift+p`. Modifiers are explicit (no `Mod`). */
export function chordToText(chord: Chord): string {
  return [
    chord.ctrl && "Ctrl",
    chord.alt && "Alt",
    chord.shift && "Shift",
    chord.meta && "Meta",
    chord.key,
  ]
    .filter(Boolean)
    .join("+");
}

const LABELS: Record<string, string> = {
  space: "Space",
  enter: "Enter",
  escape: "Esc",
  tab: "Tab",
  backspace: "Backspace",
  delete: "Delete",
  insert: "Insert",
  home: "Home",
  end: "End",
  pageup: "PageUp",
  pagedown: "PageDown",
  arrowup: "Up",
  arrowdown: "Down",
  arrowleft: "Left",
  arrowright: "Right",
};

/** `Ctrl+Shift+P`, for menus and the palette. */
export function formatKey(chords: Chord[], mac = isMac()): string {
  return chords
    .map((chord) => {
      const key = LABELS[chord.key] ?? chord.key.toUpperCase();
      return [
        chord.ctrl && "Ctrl",
        chord.alt && (mac ? "Option" : "Alt"),
        chord.shift && "Shift",
        chord.meta && (mac ? "Cmd" : "Meta"),
        key,
      ]
        .filter(Boolean)
        .join("+");
    })
    .join(" ");
}
