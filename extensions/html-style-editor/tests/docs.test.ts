import { expect, test } from "vite-plus/test";
import { mdnUrl } from "../src/docs";

test("links to the MDN page of the property", () => {
  expect(mdnUrl("margin-top")).toBe("https://developer.mozilla.org/docs/Web/CSS/margin-top");
});
