import type { Disposable, ToolContribution } from "lenz-sdk";
import { registerTool } from "./registry";

/** How long an agent waits for an extension to start before it is told the tool did not work. */
const START_TIMEOUT = 15_000;

/** A tool a manifest declared: agents see it from the start, but it runs only once implemented. */
interface Declared {
  extensionId: string;
  run?: (input: Record<string, unknown>) => unknown;
}

const declared = new Map<string, Declared>();

/**
 * How a tool that is declared but not implemented yet waits for its extension to start. Set by the
 * extension loader; without it such a tool simply fails.
 */
let waitForExtension: ((extensionId: string) => Promise<void>) | undefined;
export function setExtensionWaiter(waiter: typeof waitForExtension) {
  waitForExtension = waiter;
}

async function started(extensionId: string) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`The extension "${extensionId}" did not start in time.`)),
      START_TIMEOUT,
    );
  });
  try {
    await Promise.race([waitForExtension?.(extensionId), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Declares a tool from a manifest, before its extension runs: agents are offered it right away, and
 * a call waits for the extension. Dispose to take it away.
 */
export function declareTool(extensionId: string, declaration: ToolContribution): Disposable {
  const entry: Declared = { extensionId };
  const registration = registerTool({
    ...declaration,
    async execute(input) {
      if (!entry.run) await started(extensionId);
      if (!entry.run) {
        throw new Error(
          `The extension "${extensionId}" declares "${declaration.name}" but did not register it.`,
        );
      }
      return entry.run(input);
    },
  });
  declared.set(declaration.name, entry);
  return {
    dispose() {
      if (declared.get(declaration.name) === entry) declared.delete(declaration.name);
      registration.dispose();
    },
  };
}

/** Gives a declared tool what it does. Dispose to take it back, which leaves it waiting again. */
export function implementTool(
  name: string,
  run: (input: Record<string, unknown>) => unknown,
): Disposable {
  const entry = declared.get(name);
  if (!entry) throw new Error(`There is no declared tool "${name}".`);
  if (entry.run) throw new Error(`A tool "${name}" is already registered.`);
  entry.run = run;
  return {
    dispose() {
      if (entry.run === run) entry.run = undefined;
    },
  };
}
