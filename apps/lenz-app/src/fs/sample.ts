export const isHtmlFile = (path: string) => /\.html?$/i.test(path);

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** What a new .html file starts with: a page with the basic structure, ready to edit. */
export function htmlTemplate(path: string): string {
  const name = path.split("/").pop() ?? path;
  const title = name.replace(/\.html?$/i, "") || "Página";
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body>
  </body>
</html>
`;
}
