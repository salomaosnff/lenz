import type { Contributes, EditorContribution } from "lenz-sdk";

export class UndeclaredContributionError extends Error {}

/**
 * What one extension declared in `contributes`, and the only things it may register at run time.
 * Each check throws, saying which entry of `package.json` is missing, so a forgotten declaration
 * shows up as a clear error and not as a command that silently never appears.
 */
export function declaredBy(extensionId: string, contributes: Contributes = {}) {
  const commands = new Set((contributes.commands ?? []).map((c) => c.command));
  const views = new Set(
    Object.values(contributes.views ?? {})
      .flat()
      .map((v) => v.id),
  );
  const editors = new Map((contributes.editors ?? []).map((e) => [e.id, e]));

  const refuse = (what: string, id: string, where: string): never => {
    throw new UndeclaredContributionError(
      `Extension "${extensionId}" tried to register ${what} "${id}", which its package.json does not declare in contributes.${where}.`,
    );
  };

  return {
    command(id: string) {
      if (!commands.has(id)) refuse("the command", id, "commands");
    },
    view(id: string) {
      if (!views.has(id)) refuse("a provider for the view", id, "views");
    },
    editor(id: string): EditorContribution {
      return editors.get(id) ?? refuse("the editor", id, "editors");
    },
  };
}
