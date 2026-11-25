import type { Extension } from "./types";

export * from "./types";
export * from "./manifest";
export * from "./tool-output";

/** Identity helper that types the extension's entry point. */
export function defineExtension<Api = void>(extension: Extension<Api>): Extension<Api> {
  return extension;
}
