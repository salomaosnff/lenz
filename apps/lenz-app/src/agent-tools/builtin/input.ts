import type { AgentTool, JsonSchema } from "../types";

/** What an agent passed to a tool: anything at all, so every tool checks what it reads. */
export type Input = Record<string, unknown>;

const fail = (key: string, expected: string): never => {
  throw new Error(`"${key}" must be ${expected}.`);
};

/** A text that is not empty. */
export function text(input: Input, key: string): string {
  const value = input[key];
  return typeof value === "string" && value ? value : fail(key, "a non-empty string");
}

/** A text that may be empty, e.g. the content of a file. */
export function content(input: Input, key: string): string {
  const value = input[key];
  return typeof value === "string" ? value : fail(key, "a string");
}

export function optionalText(input: Input, key: string): string | undefined {
  return input[key] === undefined ? undefined : text(input, key);
}

export function optionalBoolean(input: Input, key: string): boolean | undefined {
  const value = input[key];
  return value === undefined
    ? undefined
    : typeof value === "boolean"
      ? value
      : fail(key, "true or false");
}

export function flag(input: Input, key: string): boolean {
  return optionalBoolean(input, key) ?? false;
}

export function requiredBoolean(input: Input, key: string): boolean {
  return optionalBoolean(input, key) ?? fail(key, "true or false");
}

export function optionalInteger(input: Input, key: string, min = 0, max = 10_000) {
  const value = input[key];
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) {
    return fail(key, `an integer from ${min} to ${max}`);
  }
  return value;
}

export function textList(input: Input, key: string): string[] {
  const value = input[key];
  if (!Array.isArray(value) || !value.length || value.some((v) => typeof v !== "string" || !v)) {
    return fail(key, "a list of non-empty strings");
  }
  return value as string[];
}

/** An object schema, which is what every tool's input is. */
export const schema = (
  properties: Record<string, JsonSchema>,
  requiredKeys: string[] = [],
): JsonSchema => ({
  type: "object",
  properties,
  ...(requiredKeys.length && { required: requiredKeys }),
});

export const string = (description: string): JsonSchema => ({ type: "string", description });
export const boolean = (description: string): JsonSchema => ({ type: "boolean", description });
export const integer = (description: string): JsonSchema => ({ type: "integer", description });

/** The path every tool about a file takes; left out, it is the active one. */
export const tabPath = string(
  "Path of an open file, as list_tabs shows it. Left out, the active file.",
);

export type Tools = AgentTool[];
