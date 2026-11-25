export const WIDTH = 400;
export const HEIGHT = 300;
/** A pixel counts as equal when no channel is further than this from the target's. */
export const TOLERANCE = 12;

export interface Comparison {
  /** Percent of the pixels that are equal, 0–100. */
  percent: number;
  /** RGBA of an image of the same size: equal pixels faded, different ones red. */
  diff: Uint8ClampedArray;
}

/** Compares two RGBA images of the same size, pixel by pixel. */
export function compareImages(
  mine: ArrayLike<number>,
  target: ArrayLike<number>,
  tolerance = TOLERANCE,
): Comparison {
  const pixels = Math.floor(target.length / 4);
  const diff = new Uint8ClampedArray(pixels * 4);
  let equal = 0;
  for (let i = 0; i < pixels; i++) {
    const at = i * 4;
    const same =
      Math.abs(mine[at]! - target[at]!) <= tolerance &&
      Math.abs(mine[at + 1]! - target[at + 1]!) <= tolerance &&
      Math.abs(mine[at + 2]! - target[at + 2]!) <= tolerance;
    if (same) {
      equal++;
      // The target, washed out, so what is wrong stands out.
      diff[at] = target[at]! * 0.35 + 255 * 0.65;
      diff[at + 1] = target[at + 1]! * 0.35 + 255 * 0.65;
      diff[at + 2] = target[at + 2]! * 0.35 + 255 * 0.65;
    } else {
      diff[at] = 230;
      diff[at + 1] = 57;
      diff[at + 2] = 70;
    }
    diff[at + 3] = 255;
  }
  return { percent: pixels ? (equal / pixels) * 100 : 0, diff };
}

/** Rounds down to one decimal, so 97.96 is never shown as 98.0 while it is below the goal. */
export const shownPercent = (percent: number) => Math.floor(percent * 10) / 10;

// ---- What the player may write -------------------------------------------------------------------

/** CSS that could load something from outside or hide a trick. */
export const FORBIDDEN_CSS = /url\s*\(|image-set\s*\(|src\s*\(|@import|expression\s*\(|\\/i;

/**
 * The scene is the `body` of the picture. The player writes `body` and `html` (and `:root`) as in
 * any page, and in the scene they mean the scene itself, which is the element `#cena`.
 */
export function rewriteSelector(selector: string): string {
  return selector.replace(/(^|[\s,>+~(])(html|body|:root)(?![\w-])/gi, "$1#cena");
}

/** The characters of the code, as the game counts them: shorter is better, once it matches. */
export const codeSize = (html: string, css: string) => html.trim().length + css.trim().length;
