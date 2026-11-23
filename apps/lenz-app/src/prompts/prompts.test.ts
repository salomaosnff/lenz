import { afterEach, describe, expect, it } from "vite-plus/test";
import {
  createPromptsApi,
  currentPrompt,
  filterEntries,
  highlight,
  type InputRequest,
  type PickRequest,
} from ".";

afterEach(() => currentPrompt.value?.answer());

const input = () => currentPrompt.value as InputRequest;
const pick = () => currentPrompt.value as PickRequest;

describe("input box", () => {
  it("shows the options and resolves with the text, or with nothing when given up", async () => {
    const { api } = createPromptsApi("ext");
    const answer = api.showInputBox({ title: "T", prompt: "Name", value: "abc", password: true });
    expect(input()).toMatchObject({
      kind: "input",
      title: "T",
      prompt: "Name",
      value: "abc",
      password: true,
      source: "ext",
    });
    input().answer("typed");
    await expect(answer).resolves.toBe("typed");
    expect(currentPrompt.value).toBeUndefined();

    const gaveUp = api.showInputBox();
    input().answer();
    await expect(gaveUp).resolves.toBeUndefined();
  });

  it("validates, with text or a severity, sync or async, and a crash does not block", async () => {
    const { api } = createPromptsApi();
    api.showInputBox({ validateInput: async (v) => (v ? undefined : "Required") });
    expect(await input().validate("")).toEqual({ message: "Required", severity: "error" });
    expect(await input().validate("x")).toBeUndefined();
    input().answer();

    api.showInputBox({
      validateInput: (v) => ({ message: "Short", severity: v.length < 3 ? "warning" : undefined }),
    });
    expect(await input().validate("a")).toEqual({ message: "Short", severity: "warning" });
    input().answer();

    api.showInputBox({ validateInput: () => Promise.reject(new Error("boom")) });
    expect(await input().validate("a")).toBeUndefined();
  });

  it("a new prompt gives up the one that was open", async () => {
    const { api } = createPromptsApi();
    const first = api.showInputBox();
    const second = api.showInputBox();
    await expect(first).resolves.toBeUndefined();
    input().answer("b");
    await expect(second).resolves.toBe("b");
  });

  it("is given up when the extension goes, but not when it is another one that goes", async () => {
    const a = createPromptsApi("a");
    const b = createPromptsApi("b");
    const answer = a.api.showInputBox();
    b.dismiss();
    expect(currentPrompt.value).toBeDefined();
    a.dismiss();
    await expect(answer).resolves.toBeUndefined();
  });
});

describe("quick pick", () => {
  const items = [
    { label: "Alpha", description: "first" },
    { label: "Beta", detail: "second one" },
    "Gamma",
  ];

  it("resolves with the very item that was chosen", async () => {
    const { api } = createPromptsApi();
    const answer = api.showQuickPick(items);
    expect(pick().entries.map((e) => e.label)).toEqual(["Alpha", "Beta", "Gamma"]);
    pick().answer([pick().entries[1]!.item]);
    expect(await answer).toBe(items[1]);
  });

  it("with canPickMany resolves with a list, starting from the ones picked", async () => {
    const { api } = createPromptsApi();
    const answer = api.showQuickPick([{ label: "A", picked: true }, { label: "B" }], {
      canPickMany: true,
    });
    expect(pick().many).toBe(true);
    expect(
      pick()
        .entries.filter((e) => e.picked)
        .map((e) => e.label),
    ).toEqual(["A"]);
    pick().answer(pick().entries.map((e) => e.item));
    expect(await answer).toHaveLength(2);

    const gaveUp = api.showQuickPick(["x"], { canPickMany: true });
    pick().answer();
    expect(await gaveUp).toBeUndefined();
  });

  it("accepts a promise of items, loading meanwhile, and passes on its failure", async () => {
    const { api } = createPromptsApi();
    let resolve!: (items: string[]) => void;
    const answer = api.showQuickPick(new Promise<string[]>((r) => (resolve = r)));
    expect(pick()).toMatchObject({ loading: true, entries: [] });
    resolve(["late"]);
    await Promise.resolve();
    await Promise.resolve();
    expect(pick()).toMatchObject({ loading: false });
    expect(pick().entries.map((e) => e.label)).toEqual(["late"]);
    pick().answer(["late"]);
    expect(await answer).toBe("late");

    const failing = api.showQuickPick(Promise.reject(new Error("nope")));
    await expect(failing).rejects.toThrow("nope");
  });

  it("filters by label (without accents or case), and by description only when asked", () => {
    const { api } = createPromptsApi();
    api.showQuickPick([
      { label: "Ação", description: "rápida" },
      { label: "Beta", description: "ação" },
      { label: "Fixa", alwaysShow: true },
    ]);
    expect(filterEntries(pick(), "ACAO").map((e) => e.label)).toEqual(["Ação", "Fixa"]);
    pick().answer();

    api.showQuickPick(
      [
        { label: "Ação", description: "rápida" },
        { label: "Beta", description: "ação" },
      ],
      { matchOnDescription: true },
    );
    expect(filterEntries(pick(), "acao").map((e) => e.label)).toEqual(["Ação", "Beta"]);
    expect(filterEntries(pick(), "a b").map((e) => e.label)).toEqual(["Beta"]); // every word must match
  });

  it("separators show only without a filter", () => {
    createPromptsApi().api.showQuickPick([{ label: "Group", kind: "separator" }, "One"]);
    expect(filterEntries(pick(), "").map((e) => e.label)).toEqual(["Group", "One"]);
    expect(filterEntries(pick(), "o").map((e) => e.label)).toEqual(["One"]);
  });

  it("highlights what matched", () => {
    expect(highlight("Abrir arquivo", "arq")).toEqual([
      { text: "Abrir ", match: false },
      { text: "arq", match: true },
      { text: "uivo", match: false },
    ]);
    expect(highlight("Ação", "ac")).toEqual([
      { text: "Aç", match: true },
      { text: "ão", match: false },
    ]);
  });
});
