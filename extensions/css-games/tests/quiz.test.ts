import { describe, expect, test } from "vite-plus/test";
import { clearProgress, loadJson, saveJson, type Store } from "../src/progress";
import {
  WEAK_BELOW,
  WEIGHT,
  choicesOf,
  grade,
  ordered,
  parseSaved,
  questions,
  shuffle,
  topics,
  verdict,
  type Answer,
} from "../src/quiz";

/** A random source that always gives the same numbers, so a shuffle can be checked. */
const sequence = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length]!;
};

const all = (ok: boolean): Answer[] => questions.map((q) => ({ id: q.id, ok }));

describe("questions", () => {
  test("ids are unique and every question has a known topic", () => {
    expect(new Set(questions.map((q) => q.id)).size).toBe(questions.length);
    const known = new Set(topics.map((t) => t.id));
    for (const q of questions) expect(known.has(q.topic)).toBe(true);
  });

  test.each(questions.map((q) => [q.id, q] as const))("%s: four different answers", (_, q) => {
    const four = [q.correct, ...q.wrong];
    expect(new Set(four).size).toBe(4);
    expect(q.explain.trim()).not.toBe("");
    expect(q.text.trim()).not.toBe("");
  });

  test("each question stands on its own: it does not continue another", () => {
    // The order is drawn each time, so a question can never depend on the one before it.
    const connective = /^\s*(e|agora|ainda|também|então|mas|além disso|e se)\b/i;
    const reference = /\b(anterior|acima|da pergunta|de antes|mesma de antes|novamente)\b/i;
    for (const q of questions) {
      expect(q.text, q.id).not.toMatch(connective);
      for (const text of [q.text, q.correct, ...q.wrong]) expect(text, q.id).not.toMatch(reference);
    }
  });

  test("there are questions of the three levels, and every topic has at least two", () => {
    for (const level of [1, 2, 3] as const) {
      expect(questions.filter((q) => q.level === level).length).toBeGreaterThanOrEqual(8);
    }
    for (const t of topics) {
      expect(questions.filter((q) => q.topic === t.id).length).toBeGreaterThanOrEqual(2);
    }
  });

  test("a topic's game, if any, is one the extension has", () => {
    const games = ["colors", "hunt", "house", "cable", "blocks", "bugs", "arena"];
    for (const t of topics) if (t.game) expect(games).toContain(t.game);
  });
});

describe("ordered", () => {
  test("goes from the easiest to the hardest, however it is shuffled", () => {
    for (const random of [Math.random, sequence(0), sequence(0.99), sequence(0.3, 0.7)]) {
      const levels = ordered(random).map((q) => q.level);
      expect(levels).toEqual([...levels].sort((a, b) => a - b));
    }
  });

  test("asks every question once", () => {
    expect(
      ordered()
        .map((q) => q.id)
        .sort(),
    ).toEqual(questions.map((q) => q.id).sort());
  });
});

describe("shuffle and choicesOf", () => {
  test("shuffle keeps the items and does not touch the original", () => {
    const original = [1, 2, 3, 4, 5];
    const shuffled = shuffle(original, sequence(0.1, 0.9, 0.5));
    expect(shuffled.slice().sort((a, b) => a - b)).toEqual(original);
    expect(original).toEqual([1, 2, 3, 4, 5]);
  });

  test("the four choices have exactly one right answer", () => {
    for (const q of questions) {
      const choices = choicesOf(q);
      expect(choices).toHaveLength(4);
      expect(choices.filter((c) => c.correct)).toEqual([{ text: q.correct, correct: true }]);
    }
  });

  test("the right answer is not always in the same place", () => {
    const places = new Set<number>();
    for (let i = 0; i < 40; i++) {
      places.add(choicesOf(questions[0]!).findIndex((c) => c.correct));
    }
    expect(places.size).toBeGreaterThan(1);
  });
});

describe("grade", () => {
  test("all right is 10 and all wrong is 0", () => {
    expect(grade(all(true)).score).toBe(10);
    expect(grade(all(false)).score).toBe(0);
    expect(grade([]).score).toBe(0);
  });

  test("a hard question is worth more than an easy one", () => {
    const easy = questions.find((q) => q.level === 1)!;
    const hard = questions.find((q) => q.level === 3)!;
    const onlyEasy = grade(questions.map((q) => ({ id: q.id, ok: q.id === easy.id })));
    const onlyHard = grade(questions.map((q) => ({ id: q.id, ok: q.id === hard.id })));
    expect(onlyHard.score).toBeGreaterThan(onlyEasy.score);
    const possible = questions.reduce((sum, q) => sum + WEIGHT[q.level], 0);
    expect(onlyHard.score).toBeCloseTo(Math.round((WEIGHT[3] / possible) * 100) / 10, 5);
  });

  test("counts the right answers by level and by topic", () => {
    const g = grade(questions.map((q) => ({ id: q.id, ok: q.level === 1 })));
    const easy = g.byLevel.find((l) => l.level === 1)!;
    expect(easy.correct).toBe(easy.total);
    expect(g.byLevel.find((l) => l.level === 3)!.correct).toBe(0);
    expect(g.correct).toBe(easy.total);
    expect(g.total).toBe(questions.length);
  });

  test("the weakest topic comes first and only the weak ones are to study", () => {
    // Everything right, except all of the flexbox questions.
    const g = grade(questions.map((q) => ({ id: q.id, ok: q.topic !== "flex" })));
    expect(g.byTopic[0]?.topic.id).toBe("flex");
    expect(g.byTopic[0]?.ratio).toBe(0);
    expect(g.weak.map((t) => t.topic.id)).toEqual(["flex"]);
    expect(g.wrong.every((q) => q.topic === "flex")).toBe(true);
  });

  test("a topic at the limit is not weak, and just under it is", () => {
    const topic = topics.find((t) => t.id === "selectors")!;
    const ofTopic = questions.filter((q) => q.topic === topic.id);
    const right = Math.ceil(ofTopic.length * WEAK_BELOW);
    const answers = ofTopic.map((q, i) => ({ id: q.id, ok: i < right }));
    expect(grade(answers).weak).toHaveLength(0);
    expect(grade(answers.map((a, i) => ({ ...a, ok: i < right - 1 }))).weak).toHaveLength(1);
  });

  test("ignores answers to questions that do not exist", () => {
    expect(grade([{ id: "nope", ok: true }]).total).toBe(0);
  });

  test("with nothing wrong, there is nothing to study", () => {
    const g = grade(all(true));
    expect(g.weak).toEqual([]);
    expect(g.wrong).toEqual([]);
  });
});

describe("verdict", () => {
  test("changes with the grade", () => {
    const titles = [10, 8, 6, 4, 1].map((s) => verdict(s).title);
    expect(new Set(titles).size).toBe(5);
    expect(verdict(9).title).toBe(verdict(10).title);
  });
});

describe("the saved result", () => {
  test("is only taken when it is a result", () => {
    const ok = { score: 7.5, correct: 20, total: 32, best: 8, at: 1 };
    expect(parseSaved(ok)).toEqual(ok);
    expect(parseSaved(null)).toBeUndefined();
    expect(parseSaved({ score: "7" })).toBeUndefined();
    expect(parseSaved({ ...ok, best: Number.NaN })).toBeUndefined();
  });

  test("is stored and cleared", () => {
    const data = new Map<string, string>();
    const store: Store = {
      getItem: (k) => data.get(k) ?? null,
      setItem: (k, v) => void data.set(k, v),
      removeItem: (k) => void data.delete(k),
    };
    saveJson("k", { a: 1 }, store);
    expect(loadJson("k", store)).toEqual({ a: 1 });
    clearProgress("k", store);
    expect(loadJson("k", store)).toBeUndefined();
    data.set("k", "{broken");
    expect(loadJson("k", store)).toBeUndefined();
  });
});
