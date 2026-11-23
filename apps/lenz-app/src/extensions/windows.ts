import { shallowReactive } from "vue";
import type { Disposable, ViewContent } from "lenz-sdk";

export interface ExtensionWindowEntry {
  /** `extensionId:windowId`, unique across extensions. */
  readonly key: string;
  title: string;
  content: ViewContent;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  open: boolean;
  /** Closes the window; used by the UI when the user closes it. */
  close(): void;
}

/** Windows created by extensions, rendered by `ExtensionWindows.vue`. */
export const extensionWindows = shallowReactive(new Map<string, ExtensionWindowEntry>());

export type { Disposable };
