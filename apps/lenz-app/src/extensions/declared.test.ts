import { describe, expect, it } from "vite-plus/test";
import { UndeclaredContributionError, declaredBy } from "./declared";

const contributes = {
  commands: [{ command: "ext.go", title: "Ir" }],
  views: {
    explorer: [{ id: "ext.tree", name: "Árvore" }],
    secondary: [{ id: "ext.props", name: "Props" }],
  },
  editors: [
    { id: "ext.visual", label: "Visual", selector: ["*.html"], priority: "default" as const },
  ],
};

describe("declaredBy", () => {
  const declared = declaredBy("ext", contributes);

  it("lets through what is declared", () => {
    expect(() => declared.command("ext.go")).not.toThrow();
    expect(() => declared.view("ext.tree")).not.toThrow();
    expect(() => declared.view("ext.props")).not.toThrow(); // views of any container
    expect(declared.editor("ext.visual")).toMatchObject({
      label: "Visual",
      selector: ["*.html"],
      priority: "default",
    });
  });

  it("refuses what is not, saying where it should be declared", () => {
    expect(() => declared.command("ext.other")).toThrow(UndeclaredContributionError);
    expect(() => declared.command("ext.other")).toThrow(
      /"ext".*command "ext.other".*contributes\.commands/,
    );
    expect(() => declared.view("ext.nope")).toThrow(/view "ext.nope".*contributes\.views/);
    expect(() => declared.editor("ext.nope")).toThrow(/editor "ext.nope".*contributes\.editors/);
  });

  it("an extension that declared nothing can register nothing", () => {
    const empty = declaredBy("empty");
    expect(() => empty.command("a")).toThrow();
    expect(() => empty.view("a")).toThrow();
    expect(() => empty.editor("a")).toThrow();
  });

  it("a command is not a view, and a view is not a command", () => {
    expect(() => declared.view("ext.go")).toThrow();
    expect(() => declared.command("ext.tree")).toThrow();
  });
});
