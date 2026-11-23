import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { builders, registerBuilder } from "../src/builders";

const make = (id: string, over = {}) => ({
  id,
  title: `Construtor ${id}`,
  icon: "lucide:box",
  open: vi.fn(),
  ...over,
});
const disposables: { dispose(): void }[] = [];
afterEach(() => disposables.splice(0).forEach((d) => d.dispose()));

describe("registerBuilder", () => {
  test("lists the builders in the order they were added", () => {
    disposables.push(registerBuilder(make("b.one")), registerBuilder(make("a.two")));
    expect(builders.map((b) => b.id)).toEqual(["b.one", "a.two"]);
  });

  test("disposing takes only that one out", () => {
    const first = registerBuilder(make("x.first"));
    disposables.push(registerBuilder(make("x.second")));
    first.dispose();
    expect(builders.map((b) => b.id)).toEqual(["x.second"]);
    first.dispose(); // twice is harmless
    expect(builders).toHaveLength(1);
  });

  test("an id cannot be taken twice", () => {
    disposables.push(registerBuilder(make("y.same")));
    expect(() => registerBuilder(make("y.same"))).toThrow(/already a builder "y.same"/);
    expect(builders).toHaveLength(1);
  });

  test("a builder needs a title", () => {
    expect(() => registerBuilder(make("z.untitled", { title: "  " }))).toThrow(/needs a title/);
    expect(builders).toHaveLength(0);
  });

  test("opening runs what the builder gave", () => {
    const builder = make("w.open");
    disposables.push(registerBuilder(builder));
    builders[0]!.open();
    expect(builder.open).toHaveBeenCalledTimes(1);
  });
});
