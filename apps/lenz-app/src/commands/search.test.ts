import { describe, expect, it } from "vite-plus/test";
import { commandDetail, searchCommands } from "./search";

const commands = [
  { id: "a", title: "Salvar tudo", category: "Arquivo" },
  { id: "b", title: "Salvar", category: "Arquivo" },
  { id: "c", title: "Alternar barra lateral", category: "Visualizar" },
  { id: "d", title: "Duplicar elemento", category: "Editor visual" },
  { id: "e", title: "Ação rápida" },
];
const ids = (query: string, recent: string[] = []) =>
  searchCommands(commands, query, recent).map((c) => c.id);

describe("searchCommands", () => {
  it("lists the recent ones first among commands that are equally complete", () => {
    expect(ids("", ["d", "c"])).toEqual(["d", "c", "e", "b", "a"]);
  });

  it("needs every word, in any order", () => {
    expect(ids("barra lateral")).toEqual(["c"]);
    expect(ids("lateral barra")).toEqual(["c"]);
    expect(ids("barra xyz")).toEqual([]);
  });

  it("searches the category too", () => {
    expect(ids("arquivo")).toEqual(["b", "a"]);
    expect(ids("editor duplicar")).toEqual(["d"]);
  });

  it("ignores case and accents", () => {
    expect(ids("ACAO")).toEqual(["e"]);
    expect(ids("acao rapida")).toEqual(["e"]);
  });

  it("puts a title that starts with the word first", () => {
    expect(ids("salvar")).toEqual(["b", "a"]);
    expect(ids("tudo")).toEqual(["a"]);
  });
});

describe("details", () => {
  // Details: an icon, a category and a shortcut count one each.
  const rich = [
    { id: "plain", title: "A comando simples" }, // 0
    { id: "icon", title: "B com ícone", icon: "lucide:x" }, // 1
    { id: "all", title: "C completo", icon: "lucide:x", category: "Cat" }, // 2 + shortcut = 3
    { id: "cat", title: "D com categoria", category: "Cat" }, // 1
    { id: "key", title: "E com atalho" }, // shortcut = 1
  ];
  const detail = (c: (typeof rich)[number]) => commandDetail(c, c.id === "key" || c.id === "all");
  const order = (query: string, recent: string[] = [], list = rich) =>
    searchCommands(list, query, recent, detail).map((c) => c.id);

  it("counts an icon, a category and a shortcut", () => {
    expect(commandDetail({}, false)).toBe(0);
    expect(commandDetail({ icon: "x" }, false)).toBe(1);
    expect(commandDetail({ category: "y" }, false)).toBe(1);
    expect(commandDetail({}, true)).toBe(1);
    expect(commandDetail({ icon: "x", category: "y" }, true)).toBe(3);
  });

  it("with no query, the most complete commands come first", () => {
    // 3, then the three with one detail by title, then the one with none.
    expect(order("")).toEqual(["all", "icon", "cat", "key", "plain"]);
  });

  it("details come before how recently a command was used", () => {
    expect(order("", ["plain"])).toEqual(["all", "icon", "cat", "key", "plain"]);
  });

  it("recent use breaks a tie in details", () => {
    expect(order("", ["key", "cat"])).toEqual(["all", "key", "cat", "icon", "plain"]);
  });

  it("with a query, the match comes before the details", () => {
    const list = [
      { id: "rich", title: "Fechar e salvar", icon: "lucide:x", category: "Cat" },
      { id: "bare", title: "Salvar" },
    ];
    // "Salvar" starts the title of `bare`; in `rich` it is only a later word.
    expect(order("salvar", [], list)).toEqual(["bare", "rich"]);
  });

  it("with a query, details break a tie between equal matches", () => {
    const list = [
      { id: "bare", title: "Salvar arquivo" },
      { id: "rich", title: "Salvar tudo", icon: "lucide:x" },
    ];
    expect(order("salvar", [], list)).toEqual(["rich", "bare"]);
  });
});
