import { shallowReactive } from "vue";
import { evaluateWhen, type ContextValue } from "./when";

export { evaluateWhen, validateWhen, type ContextValue } from "./when";

/** Reactive: anything that reads a key (or evaluates a `when`) re-runs when it changes. */
const keys = shallowReactive(new Map<string, ContextValue>());

export function setContextKey(key: string, value: ContextValue) {
  if (value === undefined) keys.delete(key);
  else keys.set(key, value);
}

export const getContextKey = (key: string) => keys.get(key);

/** Evaluates a `when` expression against the current context keys. */
export const matchesWhen = (expression: string | undefined) =>
  evaluateWhen(expression, getContextKey);
