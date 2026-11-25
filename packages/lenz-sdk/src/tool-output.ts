/** An image a tool sends to the agent, e.g. a screenshot: base64, without the `data:` prefix. */
export interface ToolImage {
  readonly data: string;
  /** e.g. `image/png`. */
  readonly mimeType: string;
}

// A symbol from the global registry, not a class: an extension bundles its own copy of this file,
// and the app must still recognize what that copy made.
const OUTPUT = Symbol.for("lenz.toolOutput");

/** What a tool returns when it has images to show next to its text. */
export interface ToolOutput {
  readonly [OUTPUT]: true;
  /** Sent to the agent as text: as is when a string, as JSON otherwise. */
  readonly value: unknown;
  readonly images: readonly ToolImage[];
}

/** Makes a tool's result carry images: `return toolOutput({ width: 375 }, [screenshot])`. */
export function toolOutput(value: unknown, images: readonly ToolImage[]): ToolOutput {
  return { [OUTPUT]: true, value, images };
}

/** What a tool returned, split into its text part and its images (none, for a plain result). */
export function splitToolOutput(result: unknown): {
  value: unknown;
  images: readonly ToolImage[];
} {
  const output = result as Partial<ToolOutput> | null | undefined;
  return output && typeof output === "object" && output[OUTPUT]
    ? { value: output.value, images: output.images ?? [] }
    : { value: result, images: [] };
}
