/** Lowercase, without accents: `Ação` matches `acao`. */
const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export interface Searchable {
  id: string;
  title: string;
  category?: string;
}

/**
 * The commands that match every word of the query (in the category or the title), best first:
 * a title that starts with the word, then one with a word that starts with it, then any match.
 *
 * `detail` says how complete a command is (the more, the higher it goes). It orders the commands
 * that match equally well, and with no query it is the main order. Recently used commands come
 * next, then the title.
 */
export function searchCommands<T extends Searchable>(
  commands: readonly T[],
  query: string,
  recent: readonly string[] = [],
  detail: (command: T) => number = () => 0,
): T[] {
  const terms = fold(query).split(/\s+/).filter(Boolean);
  const byTitle = (a: T, b: T) => a.title.localeCompare(b.title, "pt-BR");
  const used = (c: T) => {
    const i = recent.indexOf(c.id);
    return i === -1 ? Infinity : i;
  };
  const byDetail = (a: T, b: T) => detail(b) - detail(a);
  if (!terms.length) {
    return [...commands].sort((a, b) => byDetail(a, b) || used(a) - used(b) || byTitle(a, b));
  }

  const scored: { command: T; score: number }[] = [];
  for (const command of commands) {
    const title = fold(command.title);
    const full = `${fold(command.category ?? "")} ${title}`;
    let score = 0;
    for (const term of terms) {
      if (!full.includes(term)) {
        score = -1;
        break;
      }
      if (title.startsWith(term)) score += 3;
      else if (title.split(/[\s\-_/.:]+/).some((word) => word.startsWith(term))) score += 2;
      else if (title.includes(term)) score += 1;
    }
    if (score >= 0) scored.push({ command, score });
  }
  return scored
    .sort(
      (a, b) =>
        b.score - a.score ||
        byDetail(a.command, b.command) ||
        used(a.command) - used(b.command) ||
        byTitle(a.command, b.command),
    )
    .map((s) => s.command);
}

/** The details a command shows in the palette: an icon, a category and a shortcut. */
export function commandDetail(
  command: { icon?: string; category?: string },
  hasShortcut: boolean,
): number {
  return Number(!!command.icon) + Number(!!command.category) + Number(hasShortcut);
}
