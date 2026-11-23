import type { Component } from "vue";

/** Anything that must be cleaned up, e.g. a registration. */
export interface Disposable {
  dispose(): void;
}

/** An event: call it with a listener to subscribe. */
export type Event<T = void> = (listener: (value: T) => void) => Disposable;

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

/** Where a view is currently being shown. */
export type ViewLocation = "panel" | "window";

export interface ViewContext {
  /** Id of the view being resolved (the one the provider was registered for). */
  readonly viewId: string;
  /** Where the content will be shown. It is resolved again when the view moves. */
  readonly location: ViewLocation;
}

/**
 * What an extension renders into a view or a window. Two forms, so extensions
 * are not tied to Vue:
 *  - `vue-component`: a Vue component, rendered with `props`. It runs on the
 *    host's Vue, so the extension must externalize `vue` when bundling;
 *  - `shadow-dom`: imperative DOM, given an open shadow root that isolates its
 *    styles from the app. `mount` may return a cleanup function, called before
 *    the content is replaced or removed; the root is emptied afterwards.
 */
export type ViewContent =
  | { type: "vue-component"; component: Component; props?: Record<string, unknown> }
  | { type: "shadow-dom"; mount(shadowRoot: ShadowRoot): void | (() => void) };

// ---------------------------------------------------------------------------
// Views
// ---------------------------------------------------------------------------

/**
 * Supplies the content of a view, in a side bar or in a floating window.
 * A provider replaces the content the host declared for the view.
 */
export interface ViewProvider {
  /** Id of the view this provider serves. One provider per view. */
  readonly viewId: string;

  /**
   * Condition for the view to be available, e.g. `activeEditor == 'my.editor'`. While it is
   * false the view is hidden from its panel, window and views menu. Supports `!`, `&&`, `||`,
   * parentheses, `==` / `!=` against quoted strings, and bare keys (truthy). Keys come from
   * `ExtensionContext.contextKeys` and the host: `activeEditor` (id of the editor provider
   * shown) and `activeFile` (name of the file open). An empty value means always available.
   */
  readonly when?: string;

  /** Called each time the view is shown, and again after `onDidChange` fires. */
  resolveView(context: ViewContext): ViewContent | Promise<ViewContent>;

  /** Optional. Subscribe to ask the host to call `resolveView` again. */
  onDidChange?: Event;
}

export interface ViewsApi {
  /**
   * Gives a view its content. The view must be declared in `package.json` (`contributes.views`) by
   * this extension: panels and views cannot be added any other way, so this throws for a view that
   * is not declared.
   */
  registerViewProvider(provider: ViewProvider): Disposable;
}

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------

/** One state of a file in its history. */
export interface HistoryEntry {
  /** Unique within the file's history. */
  readonly id: number;
  /** What was done, e.g. `Duplicar elemento`. The first entry is the file as it was opened. */
  readonly label: string;
  /** When it was recorded (`Date.now()`). */
  readonly timestamp: number;
  /** The whole content of the file in this state. */
  readonly content: string;
}

export type HistoryChangeKind =
  /** A new entry. */
  | "record"
  /** The last entry absorbed a quick edit of the same kind (typing). */
  | "merge"
  | "undo"
  | "redo"
  /** `goTo`: a jump to any entry. */
  | "goto"
  | "clear";

export interface HistoryChange {
  readonly kind: HistoryChangeKind;
  /** Path of the file. */
  readonly path: string;
  /** The entry the file is at after the change. */
  readonly entry: HistoryEntry;
  /** Its position in `entries`. */
  readonly index: number;
}

/** An open group of edits that becomes one entry. */
export interface HistoryTransaction {
  /** Closes the group: what changed since it began is recorded as one entry. */
  commit(): void;
  /** Closes the group and puts the file back as it was when it began. No entry is recorded. */
  rollback(): void;
}

/**
 * The history of one file: a line of states (`entries`, oldest first) and the one the file is at
 * (`index`). Reading it is reactive in Vue components. Undoing and then editing drops the states
 * that were undone, as usual.
 */
export interface DocumentHistory {
  /** Path of the file. */
  readonly path: string;
  /** The states, oldest first. The first is the file as it was opened. */
  readonly entries: readonly HistoryEntry[];
  /** Position in `entries` of the state the file is at. */
  readonly index: number;
  /** The state the file is at. */
  readonly current: HistoryEntry;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  /** Goes back one entry. Returns `false` if there is none, or a transaction is open. */
  undo(): boolean;
  /** Goes forward one entry. Returns `false` if there is none, or a transaction is open. */
  redo(): boolean;
  /** Goes to any entry, by its position in `entries`. */
  goTo(index: number): boolean;
  /**
   * Groups the edits made until `commit()` into one entry, however many `setContent` calls they
   * are. Transactions nest: only the outermost one records.
   */
  beginTransaction(label: string): HistoryTransaction;
  /**
   * Runs `fn` as a transaction. If it returns a promise, the transaction ends when it settles.
   * If it throws (or rejects) the file goes back as it was and the error is rethrown.
   */
  transaction<T>(label: string, fn: () => T): T;
  /** The next edit starts a new entry even if it would merge into the last one. */
  checkpoint(): void;
  /** Forgets the entries; the file as it is now becomes the only one. */
  clear(): void;
  /** Fires after any change: new entry, merge, undo, redo, jump or clear. */
  readonly onDidChange: Event<HistoryChange>;
  /** Fires when a new entry is recorded (not for a merge). */
  readonly onDidRecord: Event<HistoryChange>;
  readonly onDidUndo: Event<HistoryChange>;
  readonly onDidRedo: Event<HistoryChange>;
}

export interface HistoryApi {
  /** The history of an open file, or `undefined` when the file is not open. */
  get(path: string): DocumentHistory | undefined;
  /** The histories of the files that are open now. */
  list(): DocumentHistory[];
  /** Fires after a change in the history of any file. */
  readonly onDidChange: Event<HistoryChange>;
  /** Fires when a file is opened (or created): its history begins with the file as it is. */
  readonly onDidOpen: Event<DocumentHistory>;
  /** Fires, with the path, when a file is closed: its history is gone. */
  readonly onDidClose: Event<string>;
}

export interface SetContentOptions {
  /** Names the entry this edit makes. Defaults to `Edição`. */
  label?: string;
  /**
   * Whether a quick edit with the same label may join the last entry instead of making a new one,
   * so typing is one entry and not one per key. Defaults to `true`; use `false` for a discrete action.
   */
  merge?: boolean;
}

// ---------------------------------------------------------------------------
// Editors
// ---------------------------------------------------------------------------

/**
 * The file an editor works on. Every editor of a file shares the same document,
 * so switching editors keeps edits and unsaved state. Its properties are live:
 * read them inside a Vue component or watch them to react to changes.
 */
export interface EditorDocument {
  /** Path of the file, unique among the open files. */
  readonly path: string;
  readonly name: string;
  readonly content: string;
  /** `true` when there are edits that were not saved. */
  readonly isDirty: boolean;
  /** Replaces the whole content. The change is recorded in `history`. */
  setContent(content: string, options?: SetContentOptions): void;
  /** What was done to the file, to read and to undo or redo. */
  readonly history: DocumentHistory;
  /** Fires with the new content after any edit, from this or another editor. */
  readonly onDidChangeContent: Event<string>;
}

export interface EditorContext {
  readonly document: EditorDocument;
}

/**
 * An editor for files. A file can have several, and the user switches between
 * them from the editor toolbar. Which ones apply is decided by `selector`.
 */
export interface EditorProvider {
  /** Unique id, e.g. `my-extension.preview`. */
  readonly id: string;
  /** Shown on the editor switcher. */
  readonly label: string;
  /** Icon name, e.g. `lucide:eye`. */
  readonly icon?: string;
  /**
   * File name patterns this editor applies to. `*` matches any run of
   * characters, case-insensitively: `['*.md', 'README']`, or `['*']` for all.
   */
  readonly selector: readonly string[];
  /**
   * `default` editors are the ones a file opens with (the first registered wins);
   * `option` editors are only offered as alternatives. Defaults to `option`.
   */
  readonly priority?: "default" | "option";

  /** Called each time this editor is shown for a file. */
  resolveEditor(context: EditorContext): ViewContent | Promise<ViewContent>;
}

/**
 * What an extension registers for an editor: how it is shown. Its id, label, icon, selector and
 * priority are declared in `package.json` (`contributes.editors`) and cannot be given here.
 */
export type EditorRegistration = Pick<EditorProvider, "id" | "resolveEditor">;

export interface EditorsApi {
  /**
   * Gives an editor its content. The editor must be declared in `package.json`
   * (`contributes.editors`) by this extension, which is where its details come from: this throws
   * for an editor that is not declared. Dispose to unregister.
   */
  registerEditorProvider(provider: EditorRegistration): Disposable;
}

// ---------------------------------------------------------------------------
// Windows
// ---------------------------------------------------------------------------

export interface WindowOptions {
  /** Unique within the extension. */
  id: string;
  title: string;
  content: ViewContent;
  /** Initial position and size, in px. */
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  /** Open right away. Defaults to `true`. */
  open?: boolean;
}

export interface ExtensionWindow extends Disposable {
  readonly id: string;
  readonly isOpen: boolean;
  open(): void;
  close(): void;
  /** Fires when the window closes, whether the extension or the user closed it. */
  readonly onDidClose: Event;
}

export interface WindowsApi {
  createWindow(options: WindowOptions): ExtensionWindow;
}

// ---------------------------------------------------------------------------
// Notifications and confirmations
// ---------------------------------------------------------------------------

/** A button of a message. Plain text works too: `showInformationMessage('Saved', 'Undo')`. */
export interface MessageItem {
  title: string;
  /**
   * In a modal message, the button that is taken as "cancel" (what Esc and closing the dialog
   * choose). Without one, the dialog gets its own Cancel button.
   */
  isCloseAffordance?: boolean;
}

export interface MessageOptions {
  /**
   * Asks for an answer before anything else can be done: a dialog in the middle of the window
   * instead of a notification in the corner. Use it for confirmations. Defaults to `false`.
   */
  modal?: boolean;
  /** More text under the message of a modal one. */
  detail?: string;
  /**
   * Closes the message when aborted, answering with `undefined`: for one that stops being true
   * (an instruction for something that already ended). Aborted before it is shown, it never shows.
   */
  signal?: AbortSignal;
}

/**
 * Each method shows the message and resolves with the item the user chose, or `undefined` when it
 * was dismissed (closed, cancelled, or the extension was deactivated). A notification without items
 * goes away by itself; with items it stays until the user answers or closes it.
 *
 * ```ts
 * const answer = await context.notifications.showWarningMessage('Delete the file?', { modal: true, detail: 'This cannot be undone.' }, 'Delete')
 * if (answer === 'Delete') ...
 * ```
 */
export interface NotificationsApi {
  showInformationMessage<T extends string | MessageItem>(
    message: string,
    ...items: T[]
  ): Promise<T | undefined>;
  showInformationMessage<T extends string | MessageItem>(
    message: string,
    options: MessageOptions,
    ...items: T[]
  ): Promise<T | undefined>;
  showWarningMessage<T extends string | MessageItem>(
    message: string,
    ...items: T[]
  ): Promise<T | undefined>;
  showWarningMessage<T extends string | MessageItem>(
    message: string,
    options: MessageOptions,
    ...items: T[]
  ): Promise<T | undefined>;
  showErrorMessage<T extends string | MessageItem>(
    message: string,
    ...items: T[]
  ): Promise<T | undefined>;
  showErrorMessage<T extends string | MessageItem>(
    message: string,
    options: MessageOptions,
    ...items: T[]
  ): Promise<T | undefined>;
}

// ---------------------------------------------------------------------------
// Prompts: asking the user for text or a choice
// ---------------------------------------------------------------------------

/** What a validation says about the text typed. An `error` blocks Enter; the others only inform. */
export interface InputBoxValidationMessage {
  message: string;
  severity?: "info" | "warning" | "error";
}

export interface InputBoxOptions {
  /** Shown above the box. */
  title?: string;
  /** Text under the box, telling what to type. */
  prompt?: string;
  /** Shown in the box while it is empty. */
  placeHolder?: string;
  /** What the box starts with. */
  value?: string;
  /** `[start, end]` of the part of `value` that starts selected. Defaults to all of it. */
  valueSelection?: [number, number];
  /** Hides what is typed. */
  password?: boolean;
  /** Keep the prompt open when the user clicks elsewhere. Esc still closes it. */
  ignoreFocusOut?: boolean;
  /**
   * Runs on every change, and before accepting. Return a message to show it (a text, or one with
   * a severity), or `undefined` / `null` when the text is fine. May be async.
   */
  validateInput?(
    value: string,
  ):
    | string
    | InputBoxValidationMessage
    | undefined
    | null
    | Promise<string | InputBoxValidationMessage | undefined | null>;
}

/** An entry of a quick pick. A plain string works too. */
export interface QuickPickItem {
  label: string;
  /** Shown next to the label, dimmed. */
  description?: string;
  /** Shown on a second line. */
  detail?: string;
  /** With `canPickMany`, starts checked. */
  picked?: boolean;
  /** Stays in the list whatever the user types. */
  alwaysShow?: boolean;
  /** `separator` makes a heading that cannot be chosen; only `label` is used. */
  kind?: "default" | "separator";
}

export interface QuickPickOptions {
  title?: string;
  /** Shown in the filter box while it is empty. */
  placeHolder?: string;
  /** Lets the user check several items. The result is then a list. */
  canPickMany?: boolean;
  /** Also filter by `description` / `detail`, not only by `label`. */
  matchOnDescription?: boolean;
  matchOnDetail?: boolean;
  /** Keep the prompt open when the user clicks elsewhere. Esc still closes it. */
  ignoreFocusOut?: boolean;
}

/**
 * Prompts that ask the user for something and resolve with the answer, or `undefined` when the user
 * gave up (Esc, or clicking away) or the extension was deactivated. Only one is on screen at a
 * time: showing another gives up the one before.
 *
 * ```ts
 * const name = await context.prompts.showInputBox({ prompt: 'Name of the file', validateInput: (v) => (v ? undefined : 'Required') })
 * const kind = await context.prompts.showQuickPick(['HTML', 'CSS'], { placeHolder: 'Pick a type' })
 * const many = await context.prompts.showQuickPick(items, { canPickMany: true })
 * ```
 */
export interface PromptsApi {
  showInputBox(options?: InputBoxOptions): Promise<string | undefined>;
  /** The items may come later (a promise): the list shows as loading meanwhile. */
  showQuickPick<T extends string | QuickPickItem>(
    items: readonly T[] | PromiseLike<readonly T[]>,
    options: QuickPickOptions & { canPickMany: true },
  ): Promise<T[] | undefined>;
  showQuickPick<T extends string | QuickPickItem>(
    items: readonly T[] | PromiseLike<readonly T[]>,
    options?: QuickPickOptions & { canPickMany?: false },
  ): Promise<T | undefined>;
}

// ---------------------------------------------------------------------------
// Extension
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

/** An action the user can run from the command palette (Ctrl+Space) or an extension can run. */
export interface Command {
  /** Unique across the app; prefix it with the extension id, e.g. `my-extension.doIt`. */
  readonly id: string;
  /** What the palette shows and searches. */
  readonly title: string;
  /** Shown before the title and searched with it, e.g. `Arquivo`. */
  readonly category?: string;
  /** Icon name, e.g. `lucide:copy`. */
  readonly icon?: string;
  /**
   * Condition for the command to be available, with the same syntax as `ViewProvider.when`.
   * While it is false the palette does not list it and `executeCommand` refuses it.
   */
  readonly when?: string;
  /** Runs the command. Whatever it returns (or resolves to) is what `executeCommand` returns. */
  run(...args: unknown[]): unknown;
}

/**
 * What an extension registers for a command: what it does. The command must be declared in
 * `package.json` (`contributes.commands`), which is where its title, icon, category and `when`
 * come from; they cannot be given here.
 */
export type CommandRegistration = Pick<Command, "id" | "run">;

export interface CommandsApi {
  /**
   * Gives a declared command its implementation. Dispose to take it back. Throws when this
   * extension does not declare the command, or when it already has an implementation.
   */
  registerCommand(command: CommandRegistration): Disposable;
  /** Runs a command by id, including the ones of other extensions and of the app. */
  executeCommand<T = unknown>(id: string, ...args: unknown[]): Promise<T>;
}

// ---------------------------------------------------------------------------
// Keybindings
// ---------------------------------------------------------------------------

/**
 * A keyboard shortcut for a command. Shortcuts only run commands: to do something else, register
 * a command for it first. An extension declares its shortcuts in `package.json`
 * (`contributes.keybindings`); there is no way to register one at run time.
 */
export interface Keybinding {
  /**
   * Modifiers joined by `+`, then the key: `Ctrl+Shift+P`, `Alt+Up`, `F2`, `Ctrl+,`. `Mod` is Cmd on
   * a Mac and Ctrl elsewhere. Separate steps with a space for a sequence: `Ctrl+K Ctrl+O`.
   */
  readonly key: string;
  /** Id of the command to run. It may be registered later, even by another extension. */
  readonly command: string;
  /** Passed to the command's `run`. */
  readonly args?: readonly unknown[];
  /**
   * Condition for the shortcut to be active, with the same syntax as `ViewProvider.when`. While
   * it is false the shortcut does nothing, but the keys are still captured: the browser's own
   * action for them (such as Ctrl+D bookmarking the page) does not run.
   *
   * A page cannot capture the shortcuts the browser reserves for its own tabs and windows: Ctrl+W,
   * Ctrl+T, Ctrl+N, Ctrl+Shift+T/N/W, Ctrl+Tab and Ctrl+PageUp/PageDown. Pick other keys.
   */
  readonly when?: string;
}

export interface ContextKeysApi {
  /** Sets a key that `when` expressions can read. Prefix it with the extension id. */
  set(key: string, value: string | number | boolean): void;
  /** Removes a key. Keys an extension set are also removed when it is deactivated. */
  unset(key: string): void;
}

export interface ExtensionsApi {
  /**
   * What a dependency returned from its `activate`: functions, refs, events, anything.
   * Only extensions listed in `extensionDependencies` of `package.json` can be asked for, and they are
   * already active when this extension's `activate` runs. Type the result with the
   * dependency's exported API type.
   */
  getExports<T = unknown>(extensionId: string): T;
}

export interface ExtensionContext {
  readonly extensionId: string;
  /** Disposables here are disposed when the extension is deactivated. */
  readonly subscriptions: Disposable[];
  readonly views: ViewsApi;
  readonly editors: EditorsApi;
  readonly windows: WindowsApi;
  readonly notifications: NotificationsApi;
  readonly prompts: PromptsApi;
  readonly contextKeys: ContextKeysApi;
  readonly commands: CommandsApi;
  readonly history: HistoryApi;
  readonly extensions: ExtensionsApi;
}

export interface Extension<Api = void> {
  /**
   * Ids of extensions that must be active first. Declare them in `extensionDependencies` of
   * `package.json`; this field adds to that list. The host activates them before this one (in any
   * order among themselves) and fails this one if any of them fails or is missing.
   */
  readonly dependencies?: readonly string[];
  /** Whatever is returned becomes this extension's public API for its dependents. */
  activate(context: ExtensionContext): Api | Promise<Api>;
  deactivate?(): void | Promise<void>;
}
