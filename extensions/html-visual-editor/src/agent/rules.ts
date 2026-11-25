import { isFragmentCanvas } from "../model";
import { splitDeclarations } from "./declarations";
import type { Declaration } from "./edit";
import { checkMedia, checkSelector } from "./safety";

/** CSSRule.STYLE_RULE and CSSRule.MEDIA_RULE: the numbers work across the canvas's window. */
const STYLE_RULE = 1;
const MEDIA_RULE = 4;

/** The style element the agent's own rules go in. */
const AGENT_ATTRIBUTE = "data-lenz-agent";

export interface RuleInfo {
  selector: string;
  /** The media query it is inside, if any. */
  media?: string;
  declarations: Record<string, string>;
  /** `agent` for the block the agent writes in, or the position of the `<style>` in the page. */
  source: string;
}

interface Located {
  rule: CSSStyleRule;
  /** Where it is: the sheet, or the media rule it is inside. */
  container: CSSStyleSheet | CSSMediaRule;
  media?: string;
  owner: HTMLStyleElement;
  index: number;
}

const normalize = (text: string) => text.replace(/\s+/g, " ").trim();

/** The `<style>` elements of the page that are the page's: not the editor's own base style. */
function pageStyles(doc: Document): HTMLStyleElement[] {
  const styles = [...doc.querySelectorAll("style")];
  return isFragmentCanvas(doc) ? styles.filter((style) => !doc.head.contains(style)) : styles;
}

/** `agentOnly`: just the block of the agent, the only one that is ever rewritten. */
function* locate(doc: Document, agentOnly = false): Generator<Located> {
  for (const [index, owner] of pageStyles(doc).entries()) {
    if (agentOnly && !owner.hasAttribute(AGENT_ATTRIBUTE)) continue;
    const sheet = owner.sheet;
    if (!sheet) continue;
    for (const rule of sheet.cssRules) {
      if (rule.type === STYLE_RULE) {
        yield { rule: rule as CSSStyleRule, container: sheet, owner, index };
      } else if (rule.type === MEDIA_RULE) {
        const media = rule as CSSMediaRule;
        for (const inner of media.cssRules) {
          if (inner.type === STYLE_RULE) {
            yield {
              rule: inner as CSSStyleRule,
              container: media,
              media: normalize(media.media.mediaText),
              owner,
              index,
            };
          }
        }
      }
    }
  }
}

const sourceOf = (located: Located) =>
  located.owner.hasAttribute(AGENT_ATTRIBUTE) ? "agent" : `style[${located.index}]`;

const declarationsOf = (rule: CSSStyleRule) => splitDeclarations(rule.style.cssText);

/** The rules of the page's stylesheets, optionally only the ones whose selector has this text. */
export function listRules(doc: Document, selector?: string): RuleInfo[] {
  const wanted = selector ? normalize(selector).toLowerCase() : undefined;
  return [...locate(doc)]
    .filter((l) => !wanted || normalize(l.rule.selectorText).toLowerCase().includes(wanted))
    .map((l) => ({
      selector: normalize(l.rule.selectorText),
      ...(l.media && { media: l.media }),
      declarations: declarationsOf(l.rule),
      source: sourceOf(l),
    }));
}

/** What the browser makes of a selector and a media query: the form it writes them in. */
function canonical(doc: Document, selector: string, media?: string) {
  const scratch = doc.implementation.createHTMLDocument("");
  const style = scratch.createElement("style");
  scratch.head.append(style);
  const sheet = style.sheet!;
  try {
    sheet.insertRule(`${checkSelector(selector)} {}`, 0);
    if (media) sheet.insertRule(`@media ${checkMedia(media)} {}`, 1);
    return {
      selector: normalize((sheet.cssRules[0] as CSSStyleRule).selectorText),
      media: media ? normalize((sheet.cssRules[1] as CSSMediaRule).media.mediaText) : undefined,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "SyntaxError") {
      throw new Error(`"${selector}"${media ? ` in "${media}"` : ""} is not valid CSS.`);
    }
    throw error;
  }
}

/** The block the agent's new rules go in, made if it is not there. */
function agentStyle(doc: Document): HTMLStyleElement {
  const found = doc.querySelector<HTMLStyleElement>(`style[${AGENT_ATTRIBUTE}]`);
  if (found) return found;
  const style = doc.createElement("style");
  style.setAttribute(AGENT_ATTRIBUTE, "");
  // Only the body of a fragment is written to the file, so the rules must be there.
  if (isFragmentCanvas(doc)) doc.body.prepend(style);
  else doc.head.append(style);
  return style;
}

/** Writes the stylesheet back into its `<style>`: the file keeps the text, not the CSSOM. */
const rewrite = (owner: HTMLStyleElement) => {
  const sheet = owner.sheet!;
  owner.textContent = [...sheet.cssRules].map((rule) => rule.cssText).join("\n");
};

/** Where a new rule goes: the end of the sheet, or inside the media rule of this query. */
function createRule(doc: Document, selector: string, media?: string) {
  const owner = agentStyle(doc);
  const sheet = owner.sheet!;
  let container: CSSStyleSheet | CSSMediaRule = sheet;
  if (media) {
    const existing = [...sheet.cssRules].find(
      (rule) =>
        rule.type === MEDIA_RULE && normalize((rule as CSSMediaRule).media.mediaText) === media,
    ) as CSSMediaRule | undefined;
    container =
      existing ??
      (sheet.cssRules[
        sheet.insertRule(`@media ${media} {}`, sheet.cssRules.length)
      ] as CSSMediaRule);
  }
  const index = container.insertRule(`${selector} {}`, container.cssRules.length);
  return { rule: container.cssRules[index] as CSSStyleRule, container, owner };
}

export interface RuleChange {
  selector: string;
  media?: string;
  declarations: Declaration[];
  remove: boolean;
}

/**
 * Creates a rule, or changes the one the agent made before for this selector and media query. The
 * rules go in a block of their own, after the page's stylesheets, so they win over equal rules
 * there; the page's own stylesheets are never rewritten (the browser would write them back in its
 * own form, losing comments and changing colors to `rgb()`).
 */
export function changeRule(doc: Document, change: RuleChange) {
  const { selector, media } = canonical(doc, change.selector, change.media);
  const same = (l: Located) => normalize(l.rule.selectorText) === selector && l.media === media;
  const found = [...locate(doc, true)].find(same);
  if (change.remove) {
    if (!found) {
      const where = `"${selector}"${media ? ` in "${media}"` : ""}`;
      throw new Error(
        [...locate(doc)].some(same)
          ? `The rule for ${where} is in the page's own stylesheet, which this tool does not change: make a rule for the same selector with the values you want, which comes later and wins.`
          : `There is no rule for ${where}.`,
      );
    }
    const at = [...found.container.cssRules].indexOf(found.rule);
    found.container.deleteRule(at);
    rewrite(found.owner);
    return { selector, ...(media && { media }), removed: true };
  }
  const target = found ?? { ...createRule(doc, selector, media), index: 0, media };
  for (const { property, value, priority } of change.declarations) {
    if (value) target.rule.style.setProperty(property, value, priority);
    else target.rule.style.removeProperty(property);
  }
  if (!target.rule.style.length) {
    // Nothing left in it: the rule goes, and so does the media query that held only it.
    target.container.deleteRule([...target.container.cssRules].indexOf(target.rule));
    const sheet = target.owner.sheet!;
    for (let i = sheet.cssRules.length - 1; i >= 0; i--) {
      const rule = sheet.cssRules[i]!;
      if (rule.type === MEDIA_RULE && !(rule as CSSMediaRule).cssRules.length) sheet.deleteRule(i);
    }
    rewrite(target.owner);
    return { selector, ...(media && { media }), removed: true };
  }
  // Read before the write-back, which replaces the sheet and with it the rule.
  const declarations = declarationsOf(target.rule);
  rewrite(target.owner);
  return {
    selector,
    ...(media && { media }),
    created: !found,
    declarations,
  };
}
