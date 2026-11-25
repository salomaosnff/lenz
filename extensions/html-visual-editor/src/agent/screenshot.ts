import { replaceCssUrls } from "./css-urls";

export interface Shot {
  width: number;
  height: number;
  /** PNG, base64. */
  data: string;
}

export interface CaptureOptions {
  /** The page is cut here if it is taller. */
  maxHeight: number;
  /** 1 is a pixel per pixel. */
  scale: number;
}

/** What could not be put in the picture, for the agent to know the picture is not the whole truth. */
export type Warnings = Set<string>;

const FETCH_TIMEOUT = 5_000;
/** The height of the window the page is laid out in: what `100vh` is. */
const VIEWPORT = 800;
const MAX_FILE = 5_000_000;

/** A file as a `data:` address, or `undefined` (and a warning) if it cannot be read. */
async function asDataUrl(
  url: string,
  base: string,
  warnings: Warnings,
): Promise<string | undefined> {
  try {
    const address = new URL(url, base).href;
    const response = await fetch(address, { signal: AbortSignal.timeout(FETCH_TIMEOUT) });
    if (!response.ok) throw new Error(String(response.status));
    const blob = await response.blob();
    if (blob.size > MAX_FILE) throw new Error("too big");
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    warnings.add(`Not in the picture, because it could not be read: ${url.slice(0, 120)}`);
    return undefined;
  }
}

/**
 * A copy of the page that stands alone: pictures, fonts and stylesheets are put inside it, because
 * the picture is made from an SVG, which cannot load anything from outside.
 */
async function standalone(doc: Document, warnings: Warnings): Promise<HTMLElement> {
  const clone = doc.documentElement.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("script").forEach((el) => el.remove());
  clone
    .querySelectorAll("[contenteditable]")
    .forEach((el) => el.removeAttribute("contenteditable"));
  const base = doc.baseURI;
  const inline = (url: string) => asDataUrl(url, base, warnings);

  await Promise.all([
    ...[...clone.querySelectorAll("img[src]")].map(async (img) => {
      const src = img.getAttribute("src")!;
      if (/^data:/i.test(src)) return;
      const data = await inline(src);
      if (data) img.setAttribute("src", data);
    }),
    ...[...clone.querySelectorAll("style")].map(async (style) => {
      style.textContent = await replaceCssUrls(style.textContent ?? "", inline);
    }),
    ...[...clone.querySelectorAll("[style]")].map(async (el) => {
      el.setAttribute("style", await replaceCssUrls(el.getAttribute("style")!, inline));
    }),
    ...[...clone.querySelectorAll('link[rel~="stylesheet"][href]')].map(async (link) => {
      const href = link.getAttribute("href")!;
      try {
        const address = new URL(href, base).href;
        const response = await fetch(address, { signal: AbortSignal.timeout(FETCH_TIMEOUT) });
        if (!response.ok) throw new Error(String(response.status));
        const style = doc.createElement("style");
        style.textContent = await replaceCssUrls(await response.text(), (url) =>
          asDataUrl(url, address, warnings),
        );
        link.replaceWith(style);
      } catch {
        warnings.add(`Not in the picture, because it could not be read: ${href.slice(0, 120)}`);
        link.remove();
      }
    }),
  ]);
  return clone;
}

/** How tall the page is when it is `width` wide: it is laid out, off screen, in a frame of that width. */
async function heightAt(html: string, width: number): Promise<number> {
  const frame = document.createElement("iframe");
  frame.setAttribute("sandbox", "allow-same-origin");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = `position:fixed;left:-100000px;top:0;width:${width}px;height:${VIEWPORT}px;border:0;visibility:hidden`;
  frame.srcdoc = html;
  const loaded = new Promise<void>((resolve) =>
    frame.addEventListener("load", () => resolve(), { once: true }),
  );
  document.body.append(frame);
  try {
    await loaded;
    const inner = frame.contentDocument!;
    // Pictures that are still arriving change the height.
    await Promise.race([
      Promise.all(
        [...inner.images]
          .filter((img) => !img.complete)
          .map((img) => new Promise((done) => (img.onload = img.onerror = done))),
      ),
      new Promise((done) => setTimeout(done, 3_000)),
    ]);
    const html = inner.documentElement;
    // Short of the window, the page is as tall as its content (`scrollHeight` would say the
    // window's); taller, something sticks out below and `scrollHeight` counts it.
    const content = Math.ceil(html.getBoundingClientRect().height);
    return Math.max(html.scrollHeight > VIEWPORT ? html.scrollHeight : content, 1);
  } finally {
    frame.remove();
  }
}

/** Draws a page of the given size, from its HTML, by way of an SVG: it is laid out by the browser at that width. */
async function paint(
  root: HTMLElement,
  width: number,
  height: number,
  scale: number,
): Promise<string> {
  const markup = new XMLSerializer().serializeToString(root);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
    `<foreignObject x="0" y="0" width="100%" height="100%">${markup}</foreignObject></svg>`;
  const image = new Image();
  image.decoding = "sync";
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("The browser could not draw this page."));
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const context = canvas.getContext("2d")!;
  // A page without a background is white, as in a browser.
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, "");
}

/** A picture of the page at each of the widths, the way the browser lays it out at that width. */
export async function capture(
  doc: Document,
  widths: number[],
  options: CaptureOptions,
): Promise<{ shots: Shot[]; warnings: string[] }> {
  const warnings: Warnings = new Set();
  const page = await standalone(doc, warnings);
  const html = `<!doctype html>${page.outerHTML}`;
  const shots: Shot[] = [];
  for (const width of widths) {
    const full = await heightAt(html, width);
    const height = Math.min(full, options.maxHeight);
    if (full > height)
      warnings.add(`At ${width}px the page is ${full}px tall: the picture is cut at ${height}px.`);
    shots.push({ width, height, data: await paint(page, width, height, options.scale) });
  }
  return { shots, warnings: [...warnings] };
}
