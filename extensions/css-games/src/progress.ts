/** Where the first game keeps its progress (it was the only one, so it kept its name). */
export const BLOCKS_KEY = "lenz.flex-grid-game.progress";
export const HOUSE_KEY = "lenz.css-games.house.progress";
export const ARENA_KEY = "lenz.css-games.arena.progress";
export const COLORS_KEY = "lenz.css-games.colors.progress";
export const CABLE_KEY = "lenz.css-games.cable.progress";
export const BUGS_KEY = "lenz.css-games.bugs.progress";
export const QUIZ_KEY = "lenz.css-games.quiz.result";
export const HUNT_KEY = "lenz.css-games.hunt.progress";

export interface Progress {
  /** Ids of the levels already solved. */
  solved: string[];
  /** Id of the level the player was on. */
  current?: string;
}

/** The part of `Storage` that is used, so a test can pass a plain object. */
export type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function browserStore(): Store | undefined {
  try {
    return localStorage;
  } catch {
    return undefined; // blocked storage: the game still works, it just forgets
  }
}

export function loadProgress(key: string, store: Store | undefined = browserStore()): Progress {
  try {
    const raw = JSON.parse(store?.getItem(key) ?? "null") as Partial<Progress> | null;
    const solved = Array.isArray(raw?.solved)
      ? raw.solved.filter((id): id is string => typeof id === "string")
      : [];
    return { solved, current: typeof raw?.current === "string" ? raw.current : undefined };
  } catch {
    return { solved: [] };
  }
}

export function saveProgress(
  key: string,
  progress: Progress,
  store: Store | undefined = browserStore(),
) {
  try {
    store?.setItem(key, JSON.stringify(progress));
  } catch {
    // full or blocked storage: nothing to do
  }
}

export function clearProgress(key: string, store: Store | undefined = browserStore()) {
  try {
    store?.removeItem(key);
  } catch {
    // see above
  }
}

/** Reads any JSON that was stored under `key`; `undefined` if there is none or it is broken. */
export function loadJson(key: string, store: Store | undefined = browserStore()): unknown {
  try {
    const raw = store?.getItem(key);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

export function saveJson(key: string, value: unknown, store: Store | undefined = browserStore()) {
  try {
    store?.setItem(key, JSON.stringify(value));
  } catch {
    // full or blocked storage: nothing to do
  }
}
