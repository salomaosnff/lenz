// Reads what an agent passed to a tool. It can pass anything, so every value is checked.

export type Input = Record<string, unknown>;

const fail = (key: string, expected: string): never => {
  throw new Error(`"${key}" must be ${expected}.`);
};

export function text(input: Input, key: string): string {
  const value = input[key];
  return typeof value === "string" && value ? value : fail(key, "a non-empty string");
}

/** A string that may be empty, like the text of an element. */
export function anyText(input: Input, key: string): string {
  const value = input[key];
  return typeof value === "string" ? value : fail(key, "a string");
}

export function optionalText(input: Input, key: string): string | undefined {
  return input[key] === undefined ? undefined : text(input, key);
}

export function flag(input: Input, key: string, fallback = false): boolean {
  const value = input[key];
  return value === undefined
    ? fallback
    : typeof value === "boolean"
      ? value
      : fail(key, "true or false");
}

export function integer(input: Input, key: string, min: number, max: number): number | undefined {
  const value = input[key];
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) {
    return fail(key, `a whole number from ${min} to ${max}`);
  }
  return value;
}

/** An object whose values the caller checks one by one. */
export function record(input: Input, key: string): Record<string, unknown> {
  const value = input[key];
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return fail(key, "an object");
  }
  return value as Record<string, unknown>;
}

/** One of a few words. */
export function choice<T extends string>(
  input: Input,
  key: string,
  allowed: readonly T[],
  fallback: T,
): T {
  const value = input[key] ?? fallback;
  return allowed.includes(value as T) ? (value as T) : fail(key, `one of ${allowed.join(", ")}`);
}
