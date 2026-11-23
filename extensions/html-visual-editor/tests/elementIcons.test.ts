import { readFileSync } from "node:fs";
import { describe, expect, test } from "vite-plus/test";
import catalog from "../src/html-elements.json";
import { ICON_TAGS, iconForTag } from "../src/elementIcons";

// The set the app registers: an icon that is not in it would show as nothing.
const lucide = JSON.parse(
  readFileSync(
    new URL("../../../apps/lenz-app/node_modules/@iconify-json/lucide/icons.json", import.meta.url),
    "utf8",
  ),
) as { icons: Record<string, unknown>; aliases?: Record<string, unknown> };
const exists = (name: string) => name in lucide.icons || name in (lucide.aliases ?? {});

describe("the icons of the elements", () => {
  test("every element of the catalog has its own", () => {
    const tags = Object.keys(catalog.elements);
    expect(tags.filter((tag) => !ICON_TAGS.includes(tag))).toEqual([]);
    expect(ICON_TAGS.filter((tag) => !tags.includes(tag))).toEqual([]);
  });

  test("every icon exists in the icon set", () => {
    const missing = ICON_TAGS.map(iconForTag).filter(
      (icon) => !exists(icon.replace("lucide:", "")),
    );
    expect(missing).toEqual([]);
  });

  test("an unknown tag gets a generic icon", () => {
    expect(iconForTag("x-custom")).toBe("lucide:code-xml");
  });
});
