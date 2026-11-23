import { ref, shallowReactive, shallowRef } from "vue";
import type { Disposable, Keybinding } from "lenz-sdk";
import { commandInfo, executeCommand, isCommandAvailable } from "../commands";
import { matchesWhen, validateWhen } from "../context";
import { chordOf, formatKey, parseKey, startsWith, type Chord } from "./keys";

interface Registered extends Keybinding {
  chords: Chord[];
  /** Set by the user on the keybindings screen, as opposed to shipped by the app or an extension. */
  user?: boolean;
}

// Registration order matters: of the shortcuts that are active, the last one wins.
const bindings = shallowReactive<Registered[]>([]);

/** Set while the keybindings screen records a new shortcut, so the keys are not run meanwhile. */
export const keybindingsPaused = ref(false);

const STORAGE_KEY = "lenz:keybindings:user";

/**
 * What the user chose, by command: a key with its condition, or `null` for "no shortcut". A command
 * with an entry here ignores the shortcuts it came with.
 */
interface UserChoice {
  key: string;
  when?: string;
}
const overrides = shallowReactive(new Map<string, UserChoice | null>());

function saveOverrides() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(overrides)));
  } catch {
    // Storage may be blocked; the choice then only lasts until the page closes.
  }
}

/** Whether a shortcut counts: the user's own, or one that came with a command they did not change. */
const isInEffect = (b: Registered) => !!b.user || !overrides.has(b.command);

/** Registers a shortcut for a command. Dispose to unregister. */
export function registerKeybinding(keybinding: Keybinding): Disposable {
  if (!keybinding.command) throw new Error("A keybinding needs a command.");
  const registered: Registered = { ...keybinding, chords: parseKey(keybinding.key) };
  bindings.push(registered);
  return {
    dispose() {
      const index = bindings.indexOf(registered);
      if (index !== -1) bindings.splice(index, 1);
    },
  };
}

/** Reactive: the shortcuts of a command, written for people (`Ctrl+S`), the winning one first. */
export function keybindingsFor(commandId: string): string[] {
  return bindings
    .filter((b) => b.command === commandId && isInEffect(b))
    .reverse()
    .map((b) => formatKey(b.chords));
}

/** Active now: its own `when` holds and so does the command's. */
const active = (b: Registered) =>
  isInEffect(b) && matchesWhen(b.when) && isCommandAvailable(b.command);

// Long enough to read the hint of what comes next.
const SEQUENCE_TIMEOUT = 4000;
let pending: Chord[] = [];
let timer: ReturnType<typeof setTimeout> | undefined;

function reset() {
  pending = [];
  clearTimeout(timer);
  if (hintKind === "sequence") clearHint();
}

// ---- Hint: what the keys held so far can lead to ----------------------------------------------

export interface KeyHintItem {
  /** The whole shortcut, `Ctrl+K Ctrl+S`. */
  keys: string;
  command: string;
  title: string;
  category?: string;
}

export interface KeyHint {
  /** What is pressed so far: `Ctrl`, or `Ctrl+K`. */
  pressed: string;
  items: KeyHintItem[];
}

/** Reactive: the hint on screen, or `null`. */
export const keyHint = shallowRef<KeyHint | null>(null);
let hintKind: "modifiers" | "sequence" | null = null;

/** How long a modifier must be held before the hint shows, so a quick shortcut never flashes it. */
const HINT_DELAY = 500;

function clearHint() {
  keyHint.value = null;
  hintKind = null;
}

function buildHint(pressed: string, matching: Registered[]) {
  const seen = new Set<string>();
  const items: KeyHintItem[] = [];
  for (const b of matching) {
    const keys = formatKey(b.chords);
    if (seen.has(keys + b.command)) continue;
    seen.add(keys + b.command);
    const info = commandInfo(b.command);
    items.push({
      keys,
      command: b.command,
      title: info?.title ?? b.command,
      category: info?.category,
    });
  }
  items.sort((a, b) => a.title.localeCompare(b.title));
  return items.length ? { pressed, items } : null;
}

/** Mid-sequence (`Ctrl+K` was pressed): the shortcuts that go on from here. */
function showSequenceHint(sequence: Chord[], candidates: Registered[]) {
  const next = candidates.filter(
    (b) => b.chords.length > sequence.length && startsWith(b.chords, sequence),
  );
  keyHint.value = buildHint(formatKey(sequence), next);
  hintKind = keyHint.value ? "sequence" : null;
}

let holdTimer: ReturnType<typeof setTimeout> | undefined;
const MODIFIER_KEYS = ["Control", "Alt", "Shift", "Meta", "AltGraph"];

/** Modifiers held with nothing else: the shortcuts whose first step uses exactly these modifiers. */
function showModifierHint(held: Pick<Chord, "ctrl" | "alt" | "shift" | "meta">) {
  const matching = [...bindings]
    .filter(active)
    .filter(
      (b) =>
        b.chords[0]!.ctrl === held.ctrl &&
        b.chords[0]!.alt === held.alt &&
        b.chords[0]!.shift === held.shift &&
        b.chords[0]!.meta === held.meta,
    );
  keyHint.value = buildHint(formatKey([{ ...held, key: "" }]), matching);
  hintKind = keyHint.value ? "modifiers" : null;
}

/**
 * Follows the modifier keys (Ctrl, Alt, Shift, Cmd) to show the hint while they are held, after a
 * short wait. Pressing any other key, or letting go, takes it away: from there the shortcut itself
 * (or the hint of its next step) takes over. Listens to `keydown` and `keyup`.
 */
export function handleModifiers(event: KeyboardEvent) {
  const held = {
    ctrl: event.ctrlKey,
    alt: event.altKey,
    shift: event.shiftKey,
    meta: event.metaKey,
  };
  const any = held.ctrl || held.alt || held.shift || held.meta;
  const isModifier = MODIFIER_KEYS.includes(event.key);
  // The hint lasts while the keys are held: with everything let go, it goes (the sequence waits on).
  if (event.type === "keyup" && !any && hintKind === "sequence") clearHint();
  // Letting go of an ordinary key says nothing about the modifiers still held.
  if (event.type === "keyup" && !isModifier) return;
  clearTimeout(holdTimer);
  if (keybindingsPaused.value || !any || (event.type === "keydown" && !isModifier)) {
    if (hintKind === "modifiers") clearHint();
    return;
  }
  if (pending.length) {
    // Holding a modifier again in the middle of a sequence shows what can come next once more.
    if (hintKind === null) showSequenceHint(pending, [...bindings].reverse().filter(active));
    return;
  }
  // Already on screen: follow the change at once. Otherwise wait.
  if (hintKind === "modifiers") showModifierHint(held);
  else holdTimer = setTimeout(() => showModifierHint(held), HINT_DELAY);
}

function hideHints() {
  clearTimeout(holdTimer);
  clearHint();
}

/**
 * A key release the page never hears (the window lost focus, the system took the key) leaves the
 * hint on screen. The mouse reports which modifiers are held, so a mouse event with none held
 * proves they were let go.
 */
export function hideWhenLetGo(event: MouseEvent) {
  const held = event.ctrlKey || event.altKey || event.shiftKey || event.metaKey;
  if (!held && keyHint.value) hideHints();
}

/** Ctrl/Cmd + these keys select, copy, cut, paste and undo text: a field keeps them. */
const TEXT_EDITING = new Set(["a", "c", "x", "v", "z", "y"]);

/**
 * Keys that belong to a field the user is typing in: plain keys (text) and the editing shortcuts
 * of the platform (select all, copy...). Everything else with a modifier is still a shortcut.
 */
function isTyping(target: EventTarget | null, chord: Chord) {
  const el = target as HTMLElement | null;
  const inField =
    !!el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));
  if (!inField) return false;
  if (!chord.ctrl && !chord.alt && !chord.meta) return true;
  return (chord.ctrl || chord.meta) && !chord.alt && TEXT_EDITING.has(chord.key);
}

/**
 * Runs the command of the shortcut these keys complete. Returns whether the keys were captured:
 * that is also the case for a registered shortcut that is not active now (its `when` is false or
 * its command is unavailable), which does nothing but keeps the browser's own action from running.
 */
export function handleKeydown(event: KeyboardEvent): boolean {
  if (keybindingsPaused.value) return false;
  const chord = chordOf(event);
  if (!chord) return false;
  if (isTyping(event.target, chord)) return false;

  // Escape gives up a sequence that was started.
  if (pending.length && chord.key === "escape" && !chord.ctrl && !chord.alt && !chord.meta) {
    reset();
    event.preventDefault();
    return true;
  }

  // The user's own shortcuts win over the ones that came with the app, then the last registered.
  const candidates = [...bindings]
    .reverse()
    .filter(active)
    .sort((a, b) => Number(!!b.user) - Number(!!a.user));
  const attempt = (sequence: Chord[]) => {
    const matching = candidates.filter((b) => startsWith(b.chords, sequence));
    const complete = matching.find((b) => b.chords.length === sequence.length);
    return { complete, longer: matching.some((b) => b.chords.length > sequence.length) };
  };

  let sequence = [...pending, chord];
  let result = attempt(sequence);
  // A step that leads nowhere starts over: `Ctrl+K` then `Ctrl+S` is just `Ctrl+S`.
  if (!result.complete && !result.longer && pending.length) {
    sequence = [chord];
    result = attempt(sequence);
  }
  reset();

  if (result.longer) {
    pending = sequence;
    showSequenceHint(sequence, candidates);
    timer = setTimeout(reset, SEQUENCE_TIMEOUT);
    event.preventDefault();
    return true;
  }
  if (!result.complete) {
    // Nothing runs, but the keys do belong to a shortcut: the browser must not act on them
    // either (Ctrl+D would bookmark the page, Ctrl+S would save it).
    if (!bindings.some((b) => startsWith(b.chords, sequence))) return false;
    event.preventDefault();
    return true;
  }

  event.preventDefault();
  event.stopPropagation();
  const { command, args = [] } = result.complete;
  executeCommand(command, ...args).catch((error) =>
    console.error(`[lenz] the shortcut ${event.key} failed to run "${command}"`, error),
  );
  return true;
}

export interface KeybindingInfo {
  key: string;
  /** `Ctrl+Shift+P` for people. */
  label: string;
  command: string;
  when?: string;
  user: boolean;
}

/** Reactive: the shortcuts in effect, for the keybindings screen. */
export function listKeybindings(): KeybindingInfo[] {
  return bindings.filter(isInEffect).map((b) => ({
    key: b.key,
    label: formatKey(b.chords),
    command: b.command,
    when: b.when,
    user: !!b.user,
  }));
}

/** Whether the user changed the shortcuts of this command. */
export const isCustomized = (commandId: string) => overrides.has(commandId);

function dropUserBinding(commandId: string) {
  for (let i = bindings.length - 1; i >= 0; i--) {
    if (bindings[i]!.user && bindings[i]!.command === commandId) bindings.splice(i, 1);
  }
}

function applyOverride(commandId: string, choice: UserChoice | null) {
  dropUserBinding(commandId);
  overrides.set(commandId, choice);
  if (!choice) return;
  // Without a condition of its own, it keeps the one the command's own shortcut had.
  const when = choice.when ?? bindings.find((b) => !b.user && b.command === commandId)?.when;
  bindings.push({
    key: choice.key,
    command: commandId,
    when: when || undefined,
    chords: parseKey(choice.key),
    user: true,
  });
}

/**
 * Gives a command this shortcut (`null` takes its shortcuts away) and remembers it. `when` is the
 * condition for it to work: left out, the command's own shortcut's is kept; empty, there is none.
 * Throws on an invalid key or condition, changing nothing.
 */
export function setUserKeybinding(commandId: string, key: string | null, when?: string) {
  if (key === null) return applyAndSave(commandId, null);
  parseKey(key);
  const condition = when?.trim();
  if (condition) validateWhen(condition);
  applyAndSave(commandId, { key, when: condition });
}

function applyAndSave(commandId: string, choice: UserChoice | null) {
  applyOverride(commandId, choice);
  saveOverrides();
}

/** Goes back to the shortcuts the command came with. */
export function resetUserKeybinding(commandId: string) {
  dropUserBinding(commandId);
  overrides.delete(commandId);
  saveOverrides();
}

/** Reads what the user chose before. Call once, before the shortcuts are used. */
export function loadUserKeybindings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<
      string,
      UserChoice | string | null
    >;
    for (const [command, value] of Object.entries(saved)) {
      try {
        // Older versions saved just the key.
        applyOverride(command, typeof value === "string" ? { key: value } : value);
      } catch {
        // A saved key that no longer parses is dropped.
      }
    }
  } catch {
    // Nothing saved, or storage is unavailable.
  }
}

/**
 * Listens for shortcuts on the whole window. Capturing, so a component that stops the event
 * cannot hide a shortcut. Safe to call twice (hot reload): the listener is the same function.
 */
export function installKeybindings() {
  window.addEventListener("keydown", handleKeydown, true);
  window.addEventListener("keydown", handleModifiers, true);
  window.addEventListener("keyup", handleModifiers, true);
  window.addEventListener("blur", hideHints);
  document.addEventListener("visibilitychange", hideHints);
  for (const type of ["pointermove", "pointerdown", "wheel"] as const) {
    window.addEventListener(type, hideWhenLetGo, true);
  }
}
