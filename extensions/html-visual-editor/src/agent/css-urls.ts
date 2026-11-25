/** `url(a.png)`, `url("a.png")` or `url('a.png')`. */
const URL_TOKEN = /url\(\s*(['"]?)([^'")]+?)\1\s*\)/gi;

/**
 * Replaces every address in the CSS (`url(...)`) with what `resolve` makes of it, usually the file
 * itself as a `data:` address. An address `resolve` has nothing for (`undefined`) stays as it was,
 * and `data:` addresses are not asked about.
 */
export async function replaceCssUrls(
  css: string,
  resolve: (url: string) => Promise<string | undefined>,
): Promise<string> {
  const found = [...css.matchAll(URL_TOKEN)].filter(([, , url]) => !/^data:/i.test(url!));
  const unique = [...new Set(found.map(([, , url]) => url!))];
  const replacements = new Map(
    await Promise.all(unique.map(async (url) => [url, await resolve(url)] as const)),
  );
  return css.replace(URL_TOKEN, (token, quote: string, url: string) => {
    const replacement = replacements.get(url);
    return replacement === undefined ? token : `url(${quote || '"'}${replacement}${quote || '"'})`;
  });
}
