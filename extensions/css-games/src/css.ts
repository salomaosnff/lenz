export interface Declaration {
  property: string;
  value: string;
}

export interface Rejected {
  property: string;
  reason: "not-allowed" | "unsafe" | "invalid";
}

export interface Parsed {
  accepted: Declaration[];
  rejected: Rejected[];
}

/** Values that could load something or break out of the declaration. */
const UNSAFE = /url\(|expression|@|[{}<>\\]|\/\*/i;

/**
 * Reads what the player typed: declarations (`justify-content: center;`), optionally wrapped in a
 * rule (`.container { ... }`). Only properties in `allowed` are kept, so a level can only be
 * solved with what it teaches, and nothing that could load a resource or leave the board.
 */
export function parseDeclarations(text: string, allowed: readonly string[]): Parsed {
  let body = text.replace(/\/\*[\s\S]*?\*\//g, "");
  const open = body.indexOf("{");
  if (open !== -1) {
    const close = body.lastIndexOf("}");
    body = body.slice(open + 1, close > open ? close : undefined);
  }
  const accepted: Declaration[] = [];
  const rejected: Rejected[] = [];
  for (const part of body.split(";")) {
    const colon = part.indexOf(":");
    if (!part.trim()) continue;
    if (colon === -1) {
      rejected.push({ property: part.trim(), reason: "invalid" });
      continue;
    }
    const property = part.slice(0, colon).trim().toLowerCase();
    const value = part.slice(colon + 1).trim();
    if (!/^[a-z-]+$/.test(property) || !value) rejected.push({ property, reason: "invalid" });
    else if (!allowed.includes(property)) rejected.push({ property, reason: "not-allowed" });
    else if (UNSAFE.test(value)) rejected.push({ property, reason: "unsafe" });
    else accepted.push({ property, value });
  }
  return { accepted, rejected };
}

/** The declarations as the text of a `style` attribute. A later declaration wins, as in CSS. */
export function toStyle(declarations: readonly Declaration[]): string {
  return declarations.map((d) => `${d.property}: ${d.value};`).join(" ");
}

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Whether two layouts put every box in the same place, give or take `tolerance` px. */
export function sameLayout(a: readonly Box[], b: readonly Box[], tolerance = 1): boolean {
  if (a.length !== b.length) return false;
  return a.every((box, i) => {
    const other = b[i]!;
    return (
      Math.abs(box.x - other.x) <= tolerance &&
      Math.abs(box.y - other.y) <= tolerance &&
      Math.abs(box.width - other.width) <= tolerance &&
      Math.abs(box.height - other.height) <= tolerance
    );
  });
}
