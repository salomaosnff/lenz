/**
 * Evaluates `when` expressions against a set of context keys.
 *
 * Grammar: `!`, `&&`, `||`, parentheses, `==` / `!=` against a quoted string (single or double),
 * `true`/`false`, and bare keys (truthy when set and not `false`, `0` or empty).
 * Example: `activeEditor == 'html-visual-editor' && !readOnly`.
 */
export type ContextValue = string | number | boolean | undefined;

type Token = { type: "op" | "string" | "name"; value: string };

const OPERATORS = ["&&", "||", "==", "!=", "!", "(", ")"];

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < source.length) {
    const char = source[i]!;
    if (/\s/.test(char)) {
      i++;
    } else if (char === '"' || char === "'") {
      const end = source.indexOf(char, i + 1);
      if (end === -1) throw new Error(`Unterminated string in when expression "${source}"`);
      tokens.push({ type: "string", value: source.slice(i + 1, end) });
      i = end + 1;
    } else {
      const op = OPERATORS.find((o) => source.startsWith(o, i));
      if (op) {
        tokens.push({ type: "op", value: op });
        i += op.length;
        continue;
      }
      const name = /^[\w.:-]+/.exec(source.slice(i))?.[0];
      if (!name) throw new Error(`Unexpected "${char}" in when expression "${source}"`);
      tokens.push({ type: "name", value: name });
      i += name.length;
    }
  }
  return tokens;
}

const truthy = (value: ContextValue) => !!value && value !== "false";
const text = (value: ContextValue) => (value === undefined ? "" : String(value));

/** Parses once; the result evaluates against any context. */
function parse(source: string): (get: (key: string) => ContextValue) => boolean {
  const tokens = tokenize(source);
  let position = 0;
  const peek = () => tokens[position];
  const isOp = (value: string) => peek()?.type === "op" && peek()!.value === value;

  type Node = (get: (key: string) => ContextValue) => ContextValue;

  function operand(): Node {
    const token = tokens[position++];
    if (!token) throw new Error(`Unexpected end of when expression "${source}"`);
    if (token.type === "string") return () => token.value;
    if (token.type === "name") {
      if (token.value === "true") return () => true;
      if (token.value === "false") return () => false;
      return (get) => get(token.value);
    }
    throw new Error(`Unexpected "${token.value}" in when expression "${source}"`);
  }

  function unary(): Node {
    if (isOp("!")) {
      position++;
      const inner = unary();
      return (get) => !truthy(inner(get));
    }
    if (isOp("(")) {
      position++;
      const inner = or();
      if (!isOp(")")) throw new Error(`Missing ")" in when expression "${source}"`);
      position++;
      return inner;
    }
    return operand();
  }

  function comparison(): Node {
    const left = unary();
    if (isOp("==") || isOp("!=")) {
      const negate = tokens[position++]!.value === "!=";
      const right = unary();
      return (get) => (text(left(get)) === text(right(get))) !== negate;
    }
    return left;
  }

  function and(): Node {
    let left = comparison();
    while (isOp("&&")) {
      position++;
      const [a, b] = [left, comparison()];
      left = (get) => truthy(a(get)) && truthy(b(get));
    }
    return left;
  }

  function or(): Node {
    let left = and();
    while (isOp("||")) {
      position++;
      const [a, b] = [left, and()];
      left = (get) => truthy(a(get)) || truthy(b(get));
    }
    return left;
  }

  const root = or();
  if (position < tokens.length) {
    throw new Error(`Unexpected "${tokens[position]!.value}" in when expression "${source}"`);
  }
  return (get) => truthy(root(get));
}

/** Throws when the expression is not valid, saying what is wrong. An empty one is valid. */
export function validateWhen(expression: string) {
  if (expression.trim()) parse(expression);
}

const cache = new Map<string, ReturnType<typeof parse>>();

/** An empty or missing expression is always true. An invalid one is false (and logged once). */
export function evaluateWhen(
  expression: string | undefined,
  get: (key: string) => ContextValue,
): boolean {
  if (!expression?.trim()) return true;
  let compiled = cache.get(expression);
  if (!compiled) {
    try {
      compiled = parse(expression);
    } catch (error) {
      console.error("[lenz]", error);
      compiled = () => false;
    }
    cache.set(expression, compiled);
  }
  return compiled(get);
}
