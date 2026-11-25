import { describe, expect, test } from "vite-plus/test";
import { splitToolOutput, toolOutput } from "../src/tool-output.ts";

const image = { data: "AAA", mimeType: "image/png" };

describe("what a tool returns", () => {
  test("a plain result has no images, and is left as it is", () => {
    for (const value of ["text", { a: 1 }, 3, null, undefined, [image]]) {
      expect(splitToolOutput(value)).toEqual({ value, images: [] });
    }
  });

  test("a result with images gives back its value and its images", () => {
    expect(splitToolOutput(toolOutput({ width: 375 }, [image]))).toEqual({
      value: { width: 375 },
      images: [image],
    });
  });

  test("is recognized when another copy of this file made it, as an extension's bundle does", () => {
    const fromOtherCopy = { [Symbol.for("lenz.toolOutput")]: true, value: "v", images: [image] };
    expect(splitToolOutput(fromOtherCopy)).toEqual({ value: "v", images: [image] });
  });

  test("an object that only looks like one is a plain result", () => {
    const lookalike = { value: "v", images: [image] };
    expect(splitToolOutput(lookalike)).toEqual({ value: lookalike, images: [] });
  });
});
