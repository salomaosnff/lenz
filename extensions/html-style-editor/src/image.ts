/** `background-image: url(...)` with a single layer. `null` for anything else. */
export function parseImage(text: string): string | null {
  const match = /^url\(\s*(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|([^"')\s][^)]*?))\s*\)$/i.exec(
    text.trim(),
  );
  if (!match) return null;
  const raw = match[1] ?? match[2] ?? match[3]!;
  return raw.replace(/\\(["'()\\])/g, "$1");
}

export const formatImage = (url: string) => `url("${url.replace(/["\\]/g, "\\$&")}")`;

export const isDataUrl = (url: string) => /^data:/i.test(url);

/** Size of an embedded image, for display: `data:image/png;base64,AAAA` -> `3 B`. */
export function dataUrlSize(url: string): string {
  const payload = url.slice(url.indexOf(",") + 1);
  const bytes = /;base64,/i.test(url) ? Math.floor((payload.length * 3) / 4) : payload.length;
  return bytes < 1024
    ? `${bytes} B`
    : bytes < 1024 ** 2
      ? `${Math.round(bytes / 1024)} KB`
      : `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

/** Long embedded images would bury the CSS: `url("data:image/png;base64,…")`. */
export const elideDataUrls = (text: string) =>
  text.replace(/data:([^;,"')]+)[^"')]*/gi, (all, type) =>
    all.length > 60 ? `data:${type};base64,…` : all,
  );
