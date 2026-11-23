import { shallowReactive } from "vue";
import type { Command, CommandContribution, Disposable } from "lenz-sdk";
import { matchesWhen } from "../context";

/** A command the app knows: declared by a manifest, implemented by code, or both. */
interface Entry {
  id: string;
  title: string;
  category?: string;
  icon?: string;
  when?: string;
  /** The extension whose `package.json` declares it, if any. */
  extensionId?: string;
  /** Missing until the extension registers it; a declared command waits for that. */
  run?: Command["run"];
  /** For an implemented command: the declaration it came from, which it goes back to. */
  declaration?: Entry;
}

const entries = shallowReactive(new Map<string, Entry>());

/**
 * How a command that is declared but not implemented yet waits for its extension to start. Set by
 * the extension loader; without it such a command simply fails.
 */
let waitForExtension: ((extensionId: string) => Promise<void>) | undefined;
export function setExtensionWaiter(waiter: typeof waitForExtension) {
  waitForExtension = waiter;
}

/**
 * Declares a command from a manifest, before its extension runs. It is listed and can be run (the
 * run waits for the extension), but does nothing until the extension registers it.
 */
export function declareCommand(extensionId: string, declaration: CommandContribution): Disposable {
  if (entries.has(declaration.command)) {
    throw new Error(`A command "${declaration.command}" is already registered.`);
  }
  const entry: Entry = {
    id: declaration.command,
    title: declaration.title,
    category: declaration.category,
    icon: declaration.icon,
    when: declaration.when,
    extensionId,
  };
  entries.set(entry.id, entry);
  return {
    dispose() {
      // Gone whether it is still waiting or has been implemented since.
      const current = entries.get(entry.id);
      if (current === entry || current?.declaration === entry) entries.delete(entry.id);
    },
  };
}

/**
 * What the app registers for a command. Wider than what an extension can give (`CommandRegistration`
 * in the SDK is only the id and what it does): the app's own commands bring their details too.
 */
export type CommandInput = Omit<Command, "title"> & { readonly title?: string };

/**
 * Registers a command, or the implementation of a declared one. Dispose to unregister (a declared
 * command goes back to waiting for an implementation).
 */
export function registerCommand(command: CommandInput): Disposable {
  const declared = entries.get(command.id);
  if (declared) {
    if (declared.run) throw new Error(`A command "${command.id}" is already registered.`);
    // The manifest is the source of the details; what the code gives explicitly wins. A new object
    // each time, so the reactive map notices the change.
    const { title, category, icon, when } = command;
    const implemented: Entry = {
      ...declared,
      ...definedOnly({ title, category, icon, when }),
      run: command.run,
      declaration: declared,
    };
    entries.set(implemented.id, implemented);
    return {
      dispose() {
        // Back to the declaration, waiting for an implementation.
        if (entries.get(implemented.id) === implemented) entries.set(implemented.id, declared);
      },
    };
  }
  if (!command.title) {
    throw new Error(`The command "${command.id}" has no title and no package.json declares it.`);
  }
  const entry: Entry = { ...command, title: command.title };
  entries.set(entry.id, entry);
  return {
    dispose() {
      if (entries.get(entry.id) === entry) entries.delete(entry.id);
    },
  };
}

const definedOnly = <T extends object>(object: T): Partial<T> =>
  Object.fromEntries(
    Object.entries(object).filter(([, value]) => value !== undefined),
  ) as Partial<T>;

const asCommand = (entry: Entry): Command => ({
  id: entry.id,
  title: entry.title,
  category: entry.category,
  icon: entry.icon,
  when: entry.when,
  run: (...args) => entry.run?.(...args),
});

/** Reactive: the commands that can run now, according to their `when`. */
export function availableCommands(): Command[] {
  return [...entries.values()].filter((entry) => matchesWhen(entry.when)).map(asCommand);
}

/** Reactive: every command the app knows, whether or not its `when` holds now. */
export const allCommands = (): Command[] => [...entries.values()].map(asCommand);

/** What the app knows to say about a command: its title and category, for lists of shortcuts. */
export const commandInfo = (id: string) => {
  const entry = entries.get(id);
  return entry && { title: entry.title, category: entry.category };
};

export const hasCommand = (id: string) => entries.has(id);

/** Reactive: whether the command exists and its `when` holds. */
export const isCommandAvailable = (id: string) => {
  const entry = entries.get(id);
  return !!entry && matchesWhen(entry.when);
};

/** Runs a command by id; refuses one that does not exist or is not available right now. */
export async function executeCommand<T = unknown>(id: string, ...args: unknown[]): Promise<T> {
  let entry = entries.get(id);
  if (!entry) throw new Error(`There is no command "${id}".`);
  if (!matchesWhen(entry.when)) throw new Error(`The command "${id}" is not available now.`);
  if (!entry.run && entry.extensionId) {
    await waitForExtension?.(entry.extensionId);
    // The extension registered it meanwhile: the map holds a new entry for it.
    entry = entries.get(id);
  }
  if (!entry?.run) {
    throw new Error(
      entry?.extensionId
        ? `The command "${id}" is declared by "${entry.extensionId}", which did not register it.`
        : `The command "${id}" has nothing to run.`,
    );
  }
  return (await entry.run(...args)) as T;
}
