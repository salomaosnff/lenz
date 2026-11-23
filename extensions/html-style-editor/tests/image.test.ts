import { describe, expect, test } from "vite-plus/test";
import { dataUrlSize, elideDataUrls, formatImage, parseImage } from "../src/image";

describe("parseImage", () => {
  test("quoted, single-quoted and bare urls", () => {
    expect(parseImage('url("a.png")')).toBe("a.png");
    expect(parseImage("url('a.png')")).toBe("a.png");
    expect(parseImage("url(a.png)")).toBe("a.png");
    expect(parseImage('  url( "https://x.com/a b.png" )  ')).toBe("https://x.com/a b.png");
  });

  test("embedded images keep their commas", () => {
    expect(parseImage('url("data:image/png;base64,AAAA,BBBB")')).toBe(
      "data:image/png;base64,AAAA,BBBB",
    );
  });

  test("only a single image", () => {
    expect(parseImage("url(a.png), url(b.png)")).toBeNull();
    expect(parseImage("linear-gradient(red, blue)")).toBeNull();
    expect(parseImage("")).toBeNull();
    expect(parseImage("url(a.png")).toBeNull();
  });

  test("round-trips what formatImage writes", () => {
    for (const url of ["a.png", "x y.png", "https://a.com/b.png?c=d&e=f"]) {
      expect(parseImage(formatImage(url))).toBe(url);
    }
  });
});

describe("data urls", () => {
  test("shows the size of an embedded image", () => {
    expect(dataUrlSize("data:image/png;base64,AAAA")).toBe("3 B");
    expect(dataUrlSize(`data:image/png;base64,${"A".repeat(4000)}`)).toBe("3 KB");
  });

  test("elides long ones and leaves short ones", () => {
    const long = `url("data:image/png;base64,${"A".repeat(500)}")`;
    expect(elideDataUrls(long)).toBe('url("data:image/png;base64,…")');
    expect(elideDataUrls('url("data:image/png;base64,AAAA")')).toBe(
      'url("data:image/png;base64,AAAA")',
    );
    expect(elideDataUrls("url(a.png)")).toBe("url(a.png)");
  });
});
