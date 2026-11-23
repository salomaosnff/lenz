import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { createPinia, setActivePinia } from "pinia";

const manifests = new Map<string, unknown>();
const modules = new Map<string, unknown>();
const storage = new Map<string, string>();
vi.stubGlobal("location", { href: "http://localhost/" });
vi.stubGlobal("localStorage", {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => void storage.set(key, value),
});
vi.stubGlobal("fetch", async (url: string) => {
  const manifest = manifests.get(new URL(url).pathname);
  return {
    ok: manifest !== undefined,
    status: manifest === undefined ? 404 : 200,
    json: async () => manifest,
  };
});
vi.stubGlobal(
  "Function",
  class {
    constructor() {
      return (url: string) => Promise.resolve({ default: modules.get(new URL(url).pathname) });
    }
  },
);

const { disableExtension, enableExtension, installFromUrl, reloadExtension, uninstallExtension } =
  await import("./manager");
const { extensionRecords } = await import("./registry");

function install(name: string, extension: unknown) {
  manifests.set(`/${name}/package.json`, { name, version: "1.0.0", main: "index.js" });
  modules.set(`/${name}/index.js`, extension);
}

afterEach(() => {
  manifests.clear();
  modules.clear();
  storage.clear();
  extensionRecords.clear();
});

describe("installing from a URL", () => {
  it("loads the extension, keeps it, and accepts the address of the package.json", async () => {
    setActivePinia(createPinia());
    install("from-url", { activate() {} });
    const id = await installFromUrl("http://localhost/from-url/package.json");
    expect(id).toBe("from-url");
    expect(extensionRecords.get("from-url")).toMatchObject({ status: "active", builtin: false });
    expect(JSON.parse(storage.get("lenz:extensions:external")!)).toEqual([
      { id: "from-url", url: "http://localhost/from-url/" },
    ]);
    await expect(installFromUrl("http://localhost/from-url/")).rejects.toThrow(/already installed/);
    await uninstallExtension("from-url");
    expect(extensionRecords.has("from-url")).toBe(false);
    expect(storage.get("lenz:extensions:external")).toBe("[]");
  });

  it("refuses what is not an http(s) URL or has no package.json", async () => {
    await expect(installFromUrl("javascript:alert(1)")).rejects.toThrow(/http/);
    await expect(installFromUrl("http://localhost/nothing/")).rejects.toThrow(/package\.json/);
  });
});

describe("turning an extension on and off", () => {
  it("disables, enables and reloads, calling activate and deactivate each time", async () => {
    setActivePinia(createPinia());
    const activate = vi.fn();
    const deactivate = vi.fn();
    install("toggled", { activate, deactivate });
    await installFromUrl("http://localhost/toggled/");

    await disableExtension("toggled");
    expect(extensionRecords.get("toggled")?.status).toBe("inactive");
    expect(deactivate).toHaveBeenCalledTimes(1);
    expect(JSON.parse(storage.get("lenz:extensions:disabled")!)).toEqual(["toggled"]);

    await enableExtension("toggled");
    expect(extensionRecords.get("toggled")?.status).toBe("active");
    expect(storage.get("lenz:extensions:disabled")).toBe("[]");

    await reloadExtension("toggled");
    expect(activate).toHaveBeenCalledTimes(3);
    expect(deactivate).toHaveBeenCalledTimes(2);
    await uninstallExtension("toggled");
  });

  it("a failing extension is kept with its error, and reload tries again", async () => {
    setActivePinia(createPinia());
    install("fragile", {
      activate() {
        throw new Error("boom");
      },
    });
    await expect(installFromUrl("http://localhost/fragile/")).rejects.toThrow("boom");
    expect(extensionRecords.get("fragile")).toMatchObject({ status: "error", error: "boom" });
    install("fragile", { activate() {} });
    await reloadExtension("fragile");
    expect(extensionRecords.get("fragile")).toMatchObject({ status: "active", error: undefined });
    await uninstallExtension("fragile");
  });
});
