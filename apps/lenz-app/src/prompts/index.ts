import { shallowReactive, shallowRef } from "vue";
import type {
  InputBoxOptions,
  InputBoxValidationMessage,
  PromptsApi,
  QuickPickItem,
  QuickPickOptions,
} from "lenz-sdk";

interface Base {
  /** Who asked: an extension id. */
  readonly source?: string;
  readonly title?: string;
  readonly ignoreFocusOut: boolean;
}

export interface InputRequest extends Base {
  readonly kind: "input";
  readonly prompt?: string;
  readonly placeHolder?: string;
  readonly value: string;
  readonly valueSelection?: [number, number];
  readonly password: boolean;
  /** The message for a text, or `undefined` when it is fine. */
  validate(value: string): Promise<InputBoxValidationMessage | undefined>;
  /** Gives the text, or gives up with nothing. */
  answer(value?: string): void;
}

/** One line of a quick pick. `item` is what the extension gave, and what it gets back. */
export interface PickEntry {
  readonly item: unknown;
  readonly label: string;
  readonly description?: string;
  readonly detail?: string;
  readonly picked: boolean;
  readonly alwaysShow: boolean;
  readonly separator: boolean;
}

export interface PickRequest extends Base {
  readonly kind: "pick";
  readonly placeHolder?: string;
  readonly many: boolean;
  readonly matchOnDescription: boolean;
  readonly matchOnDetail: boolean;
  /** True until a promise of items is done. */
  loading: boolean;
  entries: PickEntry[];
  /** The chosen items, or gives up with nothing. */
  answer(items?: unknown[]): void;
}

export type PromptRequest = InputRequest | PickRequest;

/** What is on screen now: one prompt at a time. */
export const currentPrompt = shallowRef<PromptRequest>();

/** Shows a prompt, giving up the one that was there. Returns what to call to end it. */
function present<R extends PromptRequest>(request: R) {
  currentPrompt.value?.answer();
  currentPrompt.value = request;
}

function finish(request: PromptRequest) {
  if (currentPrompt.value !== request) return false;
  currentPrompt.value = undefined;
  return true;
}

const asMessage = (
  result: string | InputBoxValidationMessage | undefined | null,
): InputBoxValidationMessage | undefined =>
  !result
    ? undefined
    : typeof result === "string"
      ? { message: result, severity: "error" }
      : { severity: "error", ...result };

function showInputBox(
  source: string | undefined,
  options: InputBoxOptions = {},
): Promise<string | undefined> {
  return new Promise((resolve) => {
    const request: InputRequest = {
      kind: "input",
      source,
      title: options.title,
      prompt: options.prompt,
      placeHolder: options.placeHolder,
      value: options.value ?? "",
      valueSelection: options.valueSelection,
      password: options.password ?? false,
      ignoreFocusOut: options.ignoreFocusOut ?? false,
      async validate(value) {
        try {
          return asMessage(await options.validateInput?.(value));
        } catch (error) {
          // A validation that crashes must not trap the user in the box.
          console.error("[lenz] validateInput failed", error);
          return undefined;
        }
      },
      answer(value) {
        if (finish(request)) resolve(value);
      },
    };
    present(request);
  });
}

const toEntry = (item: string | QuickPickItem): PickEntry =>
  typeof item === "string"
    ? { item, label: item, picked: false, alwaysShow: false, separator: false }
    : {
        item,
        label: item.label,
        description: item.description,
        detail: item.detail,
        picked: item.picked ?? false,
        alwaysShow: item.alwaysShow ?? false,
        separator: item.kind === "separator",
      };

function showQuickPick(
  source: string | undefined,
  items: readonly (string | QuickPickItem)[] | PromiseLike<readonly (string | QuickPickItem)[]>,
  options: QuickPickOptions = {},
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const many = options.canPickMany ?? false;
    const request: PickRequest = shallowReactive<PickRequest>({
      kind: "pick",
      source,
      title: options.title,
      placeHolder: options.placeHolder,
      many,
      matchOnDescription: options.matchOnDescription ?? false,
      matchOnDetail: options.matchOnDetail ?? false,
      ignoreFocusOut: options.ignoreFocusOut ?? false,
      loading: false,
      entries: [],
      answer(chosen) {
        if (!finish(request)) return;
        resolve(chosen === undefined ? undefined : many ? chosen : chosen[0]);
      },
    });
    const fill = (list: readonly (string | QuickPickItem)[]) => {
      request.entries = list.map(toEntry);
      request.loading = false;
    };
    if (Array.isArray(items)) fill(items);
    else {
      request.loading = true;
      Promise.resolve(items as PromiseLike<readonly (string | QuickPickItem)[]>).then(
        (list) => currentPrompt.value === request && fill(list),
        (error) => {
          if (finish(request)) reject(error);
        },
      );
    }
    present(request);
  });
}

/** What an extension gets: its prompts carry its id, and are given up when it is deactivated. */
export function createPromptsApi(source?: string): { api: PromptsApi; dismiss(): void } {
  const api = {
    showInputBox: (options?: InputBoxOptions) => showInputBox(source, options),
    showQuickPick: (items: never, options?: QuickPickOptions) =>
      showQuickPick(source, items, options),
  } as PromptsApi;
  return {
    api,
    dismiss: () => {
      const current = currentPrompt.value;
      if (current && current.source === source) current.answer();
    },
  };
}

/** For the app's own code: the same prompts, with no extension as the source. */
export const { api: prompts } = createPromptsApi();

// ---- Filtering a quick pick -----------------------------------------------------------------

/** Lowercase without accents, one character for each character, so positions line up. */
const foldChars = (text: string) =>
  Array.from(
    text,
    (char) =>
      char
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase() || char,
  );

const fold = (text: string) => foldChars(text).join("");

/** The entries that match every word typed, in their order; separators only show with no filter. */
export function filterEntries(request: PickRequest, query: string): PickEntry[] {
  const terms = fold(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return request.entries;
  return request.entries.filter((entry) => {
    if (entry.separator) return false;
    if (entry.alwaysShow) return true;
    const text = [
      entry.label,
      request.matchOnDescription ? entry.description : undefined,
      request.matchOnDetail ? entry.detail : undefined,
    ]
      .filter(Boolean)
      .map((part) => fold(part!))
      .join("\n");
    return terms.every((term) => text.includes(term));
  });
}

/** The label cut into pieces, marking the ones that matched what was typed. */
export function highlight(label: string, query: string): { text: string; match: boolean }[] {
  const terms = fold(query).split(/\s+/).filter(Boolean);
  const chars = Array.from(label);
  const folded = fold(label);
  const marked = new Array<boolean>(chars.length).fill(false);
  for (const term of terms) {
    const at = folded.indexOf(term);
    if (at !== -1) for (let i = at; i < at + Array.from(term).length; i++) marked[i] = true;
  }
  const pieces: { text: string; match: boolean }[] = [];
  chars.forEach((char, i) => {
    const last = pieces.at(-1);
    if (last && last.match === marked[i]) last.text += char;
    else pieces.push({ text: char, match: marked[i]! });
  });
  return pieces;
}
