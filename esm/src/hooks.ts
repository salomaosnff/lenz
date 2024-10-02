import { ensureInitialized } from "./util.js";

export function onAfter(event: string, callback: Function) {
  return ensureInitialized().hooks().onAfter(event, callback);
}
export function onBefore(event: string, callback: Function) {
  return ensureInitialized().hooks().onBefore(event, callback);
}
