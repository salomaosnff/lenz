import { shallowReactive } from "vue";
import type { MessageItem, MessageOptions, NotificationsApi } from "lenz-sdk";

export type Severity = "info" | "warning" | "error";

/** A message on screen: a notification in the corner, or a modal dialog. */
export interface Notice {
  readonly id: number;
  readonly severity: Severity;
  readonly message: string;
  readonly detail?: string;
  readonly modal: boolean;
  /** Who showed it: an extension id. */
  readonly source?: string;
  /** What the buttons say, in order. `closeIndex` is the one that counts as cancelling. */
  readonly labels: string[];
  readonly closeIndex: number;
  /** Answers with the button at `index`, or with nothing, and takes the message away. */
  answer(index?: number): void;
}

/** Reactive, oldest first. The notifications are all shown; of the modal ones only the first is. */
export const notices = shallowReactive<Notice[]>([]);

/** How long a notification without buttons stays, in ms. Errors stay longer. */
const LIFETIME: Record<Severity, number> = { info: 6000, warning: 8000, error: 12000 };

let counter = 0;

/**
 * The notifications in the order they are shown, the first being the one in front: those that ask
 * for an answer (they have buttons) come first, then the others, and in each group the newest first.
 */
export function orderedToasts(): Notice[] {
  return notices
    .filter((n) => !n.modal)
    .sort((a, b) => Number(b.labels.length > 0) - Number(a.labels.length > 0) || b.id - a.id);
}

/** Timers of the notifications that go away by themselves, started when they reach the front. */
const timers = new Map<number, ReturnType<typeof setTimeout>>();

/**
 * One notification is in front at a time. Its time starts running when it gets there (the ones
 * behind it wait their turn), and keeps running if a newer one takes its place.
 */
function startFrontTimer() {
  const front = orderedToasts()[0];
  if (!front || front.labels.length || timers.has(front.id)) return;
  timers.set(
    front.id,
    setTimeout(() => front.answer(), LIFETIME[front.severity]),
  );
}

const isOptions = (value: unknown): value is MessageOptions =>
  typeof value === "object" && value !== null && !("title" in value);

function show<T extends string | MessageItem>(
  severity: Severity,
  source: string | undefined,
  message: string,
  rest: unknown[],
): Promise<T | undefined> {
  const options = isOptions(rest[0]) ? (rest.shift() as MessageOptions) : {};
  const items = rest as T[];
  const modal = options.modal ?? false;
  const labels = items.map((item) => (typeof item === "string" ? item : item.title));
  let closeIndex = items.findIndex((item) => typeof item !== "string" && item.isCloseAffordance);

  // A confirmation always has a way out, and always has a way to say "ok".
  if (modal && closeIndex === -1) {
    if (!labels.length) labels.push("OK");
    else {
      labels.push("Cancelar");
      closeIndex = labels.length - 1;
    }
  }

  return new Promise<T | undefined>((resolve) => {
    if (options.signal?.aborted) return resolve(undefined);
    const notice: Notice = {
      id: ++counter,
      severity,
      message,
      detail: options.detail,
      modal,
      source,
      labels,
      closeIndex,
      answer(index) {
        const at = notices.indexOf(notice);
        if (at === -1) return;
        clearTimeout(timers.get(notice.id));
        timers.delete(notice.id);
        notices.splice(at, 1);
        startFrontTimer();
        options.signal?.removeEventListener("abort", abort);
        // Cancelling, or a button that was added by the dialog itself, is no answer.
        resolve(
          index === undefined || index >= items.length || index === closeIndex
            ? undefined
            : items[index],
        );
      },
    };
    const abort = () => notice.answer();
    options.signal?.addEventListener("abort", abort, { once: true });
    notices.push(notice);
    startFrontTimer();
  });
}

/** Closes every notification, answering each with nothing. Confirmations (modal) are left: they ask for an answer. */
export function dismissAllNotifications() {
  notices.filter((n) => !n.modal).forEach((n) => n.answer());
}

/** What an extension gets: its messages carry its id, and go away when it is deactivated. */
export function createNotificationsApi(source?: string): {
  api: NotificationsApi;
  dismissAll(): void;
} {
  const api = {
    showInformationMessage: (message: string, ...rest: unknown[]) =>
      show("info", source, message, rest),
    showWarningMessage: (message: string, ...rest: unknown[]) =>
      show("warning", source, message, rest),
    showErrorMessage: (message: string, ...rest: unknown[]) => show("error", source, message, rest),
  } as NotificationsApi;
  return {
    api,
    dismissAll: () => notices.filter((n) => n.source === source).forEach((n) => n.answer()),
  };
}

/** For the app's own code: the same messages, with no extension as the source. */
export const { api: notifications } = createNotificationsApi();
