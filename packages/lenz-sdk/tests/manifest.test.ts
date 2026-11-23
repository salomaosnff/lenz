import { describe, expect, test } from "vite-plus/test";
import { InvalidManifestError, parseManifest } from "../src/manifest.ts";

const minimal = { name: "my-extension", version: "1.0.0", main: "index.js" };

describe("parseManifest", () => {
  test("a manifest with only what is required", () => {
    expect(parseManifest(minimal)).toEqual(minimal);
  });

  test("keeps what the app understands and drops the rest", () => {
    const manifest = parseManifest({
      ...minimal,
      displayName: "Minha extensão",
      description: "Faz coisas",
      private: true,
      scripts: { build: "x" },
      devDependencies: { vue: "1" },
      extensionDependencies: ["other"],
    });
    expect(manifest).toEqual({
      ...minimal,
      displayName: "Minha extensão",
      description: "Faz coisas",
      extensionDependencies: ["other"],
    });
  });

  test("reads every kind of contribution", () => {
    const manifest = parseManifest({
      ...minimal,
      contributes: {
        commands: [
          {
            command: "my-extension.go",
            title: "Ir",
            category: "Minha",
            icon: "lucide:x",
            when: "a && b",
          },
        ],
        editors: [
          {
            id: "my-extension.visual",
            label: "Visual",
            icon: "lucide:eye",
            selector: ["*.html", "README"],
            priority: "default",
          },
        ],
        keybindings: [{ key: "Ctrl+K", command: "my-extension.go", when: "a", args: [1, "x"] }],
        viewsContainers: {
          activitybar: [{ id: "my-extension", title: "Minha", icon: "lucide:box", order: 20 }],
        },
        views: {
          "my-extension": [
            {
              id: "my-extension.list",
              name: "Lista",
              when: "a",
              collapsed: true,
              autoHeight: true,
            },
          ],
          explorer: [{ id: "my-extension.tree", name: "Árvore" }],
        },
      },
    });
    expect(manifest.contributes).toEqual({
      commands: [
        {
          command: "my-extension.go",
          title: "Ir",
          category: "Minha",
          icon: "lucide:x",
          when: "a && b",
        },
      ],
      editors: [
        {
          id: "my-extension.visual",
          label: "Visual",
          icon: "lucide:eye",
          selector: ["*.html", "README"],
          priority: "default",
        },
      ],
      keybindings: [{ key: "Ctrl+K", command: "my-extension.go", when: "a", args: [1, "x"] }],
      viewsContainers: {
        activitybar: [{ id: "my-extension", title: "Minha", icon: "lucide:box", order: 20 }],
      },
      views: {
        "my-extension": [
          { id: "my-extension.list", name: "Lista", when: "a", collapsed: true, autoHeight: true },
        ],
        explorer: [{ id: "my-extension.tree", name: "Árvore" }],
      },
    });
  });

  test("drops unknown fields of a contribution", () => {
    const manifest = parseManifest({
      ...minimal,
      contributes: { commands: [{ command: "a.b", title: "T", secret: 1 }] },
    });
    expect(manifest.contributes!.commands![0]).toEqual({ command: "a.b", title: "T" });
  });
});

describe("parseManifest refuses a manifest that is wrong, saying where", () => {
  const rejects = (data: unknown, message: RegExp) => {
    expect(() => parseManifest(data)).toThrow(InvalidManifestError);
    expect(() => parseManifest(data)).toThrow(message);
  };

  test("not an object, or missing what is required", () => {
    rejects(null, /must be an object/);
    rejects([], /must be an object/);
    rejects({ ...minimal, name: undefined }, /"name"/);
    rejects({ ...minimal, version: "" }, /"version"/);
    rejects({ ...minimal, main: undefined }, /"main"/);
  });

  test("a name that is not safe as a folder and an id", () => {
    rejects({ ...minimal, name: "../evil" }, /"name"/);
    rejects({ ...minimal, name: "a b" }, /"name"/);
  });

  test("main must stay inside the extension folder", () => {
    rejects({ ...minimal, main: "../other/index.js" }, /"main" must be a path inside/);
    rejects({ ...minimal, main: "/etc/index.js" }, /"main" must be a path inside/);
    rejects({ ...minimal, main: "https://evil.example/x.js" }, /"main" must be a path inside/);
    rejects({ ...minimal, main: "a\\..\\b.js" }, /"main" must be a path inside/);
    expect(parseManifest({ ...minimal, main: "dist/index.js" }).main).toBe("dist/index.js");
  });

  test("contributions of the wrong shape", () => {
    rejects({ ...minimal, contributes: 5 }, /contributes/);
    rejects({ ...minimal, contributes: { commands: {} } }, /"commands" must be a list/);
    rejects(
      { ...minimal, contributes: { commands: [{ title: "x" }] } },
      /commands\[0\].*"command"/,
    );
    rejects({ ...minimal, contributes: { commands: [{ command: "a.b" }] } }, /"title"/);
    rejects(
      { ...minimal, contributes: { keybindings: [{ key: "Ctrl+K" }] } },
      /keybindings\[0\].*"command"/,
    );
    rejects(
      { ...minimal, contributes: { keybindings: [{ key: "K", command: "a", args: "x" }] } },
      /"args" must be a list/,
    );
    rejects(
      { ...minimal, contributes: { viewsContainers: { activitybar: [{ id: "a", title: "A" }] } } },
      /"icon"/,
    );
    rejects({ ...minimal, contributes: { views: { a: [{ id: "v" }] } } }, /"name"/);
    rejects(
      {
        ...minimal,
        contributes: {
          viewsContainers: { activitybar: [{ id: "a", title: "A", icon: "i", order: "first" }] },
        },
      },
      /"order" must be a number/,
    );
    rejects(
      {
        ...minimal,
        contributes: {
          viewsContainers: { activitybar: [{ id: "a", title: "A", icon: "i", order: Infinity }] },
        },
      },
      /"order"/,
    );
    rejects(
      { ...minimal, contributes: { views: { a: [{ id: "v", name: "V", collapsed: "yes" }] } } },
      /"collapsed"/,
    );
    rejects(
      { ...minimal, contributes: { views: { a: [{ id: "v", name: "V", autoHeight: 1 }] } } },
      /"autoHeight"/,
    );
    rejects(
      { ...minimal, contributes: { editors: [{ id: "e", label: "E" }] } },
      /at least one pattern/,
    );
    rejects(
      { ...minimal, contributes: { editors: [{ id: "e", label: "E", selector: "*.html" }] } },
      /"selector" must be a list/,
    );
    rejects(
      { ...minimal, contributes: { editors: [{ id: "e", label: "E", selector: [] }] } },
      /at least one pattern/,
    );
    rejects(
      {
        ...minimal,
        contributes: { editors: [{ id: "e", label: "E", selector: ["*"], priority: "high" }] },
      },
      /"priority"/,
    );
    rejects(
      { ...minimal, contributes: { editors: [{ label: "E", selector: ["*"] }] } },
      /editors\[0\].*"id"/,
    );
    rejects({ ...minimal, extensionDependencies: "x" }, /"extensionDependencies" must be a list/);
  });

  test("the same command, container or view declared twice", () => {
    rejects(
      {
        ...minimal,
        contributes: {
          commands: [
            { command: "a.b", title: "A" },
            { command: "a.b", title: "B" },
          ],
        },
      },
      /command "a.b" is declared twice/,
    );
    rejects(
      {
        ...minimal,
        contributes: {
          editors: [
            { id: "e", label: "A", selector: ["*"] },
            { id: "e", label: "B", selector: ["*"] },
          ],
        },
      },
      /editor "e" is declared twice/,
    );
    rejects(
      {
        ...minimal,
        contributes: { views: { x: [{ id: "v", name: "A" }], y: [{ id: "v", name: "B" }] } },
      },
      /view "v" is declared twice/,
    );
  });
});
