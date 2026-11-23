import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import type { MessageItem } from "lenz-sdk";
import { createNotificationsApi, dismissAllNotifications, notices, orderedToasts } from ".";

afterEach(() => {
  notices.splice(0);
  vi.useRealTimers();
});

describe("notifications", () => {
  it("resolves with the item that was chosen, whatever its form", async () => {
    const { api } = createNotificationsApi("ext");
    const plain = api.showInformationMessage("Saved", "Undo", "Close");
    expect(notices[0]).toMatchObject({
      message: "Saved",
      labels: ["Undo", "Close"],
      modal: false,
      source: "ext",
    });
    notices[0]!.answer(1);
    await expect(plain).resolves.toBe("Close");

    const item = { title: "Retry" };
    const object = api.showErrorMessage("Failed", item);
    notices[0]!.answer(0);
    expect(await object).toBe(item); // the very object, so it can carry more data
  });

  it("resolves with undefined when closed, and one without buttons goes away by itself", async () => {
    vi.useFakeTimers();
    const { api } = createNotificationsApi();
    const closed = api.showWarningMessage("Careful", "Ok");
    notices[0]!.answer();
    await expect(closed).resolves.toBeUndefined();

    const timed = api.showInformationMessage("Hello");
    expect(notices).toHaveLength(1);
    vi.advanceTimersByTime(6000);
    await expect(timed).resolves.toBeUndefined();
    expect(notices).toHaveLength(0);
  });

  it("shows the newest in front, unless one that asks for an answer is there", () => {
    const { api } = createNotificationsApi();
    api.showInformationMessage("Old");
    api.showInformationMessage("New");
    expect(orderedToasts().map((n) => n.message)).toEqual(["New", "Old"]);
    api.showWarningMessage("Asks", "Yes");
    api.showInformationMessage("Newest");
    // The one with buttons stays in front of newer ones, which wait behind it.
    expect(orderedToasts().map((n) => n.message)).toEqual(["Asks", "Newest", "New", "Old"]);
    api.showErrorMessage("Asks too", "Retry");
    expect(
      orderedToasts()
        .map((n) => n.message)
        .slice(0, 2),
    ).toEqual(["Asks too", "Asks"]);
  });

  it("the time of one that was never in front only starts when it comes there", async () => {
    vi.useFakeTimers();
    const { api } = createNotificationsApi();
    api.showWarningMessage("Asks", "Yes");
    const hidden = api.showInformationMessage("Behind");
    vi.advanceTimersByTime(60_000); // it has been behind all this time
    expect(notices.map((n) => n.message)).toEqual(["Asks", "Behind"]);
    notices[0]!.answer(0);
    vi.advanceTimersByTime(5000);
    expect(notices).toHaveLength(1);
    vi.advanceTimersByTime(1000);
    await hidden;
    expect(notices).toHaveLength(0);
  });

  it("can close all of them at once, but not the confirmations", async () => {
    const { api } = createNotificationsApi();
    const a = api.showInformationMessage("A", "Ok");
    const b = api.showErrorMessage("B");
    const confirmation = api.showWarningMessage("C", { modal: true }, "Yes");
    dismissAllNotifications();
    await expect(Promise.all([a, b])).resolves.toEqual([undefined, undefined]);
    expect(notices.map((n) => n.message)).toEqual(["C"]);
    notices[0]!.answer(0);
    await expect(confirmation).resolves.toBe("Yes");
  });

  it("closes when its signal is aborted, and never shows when it is aborted already", async () => {
    const { api } = createNotificationsApi();
    const controller = new AbortController();
    const answer = api.showInformationMessage("Instruction", { signal: controller.signal }, "Ok");
    expect(notices).toHaveLength(1);
    controller.abort();
    await expect(answer).resolves.toBeUndefined();
    expect(notices).toHaveLength(0);
    await expect(
      api.showInformationMessage("Late", { signal: controller.signal }),
    ).resolves.toBeUndefined();
    expect(notices).toHaveLength(0);
  });

  it("a message with buttons stays", () => {
    vi.useFakeTimers();
    createNotificationsApi().api.showInformationMessage("Stay", "Ok");
    vi.advanceTimersByTime(60_000);
    expect(notices).toHaveLength(1);
  });

  it("a modal confirmation gets its Cancel, and cancelling answers nothing", async () => {
    const { api } = createNotificationsApi();
    const answer = api.showWarningMessage("Delete?", { modal: true, detail: "No undo." }, "Delete");
    expect(notices[0]).toMatchObject({
      modal: true,
      detail: "No undo.",
      labels: ["Delete", "Cancelar"],
      closeIndex: 1,
    });
    notices[0]!.answer(1);
    await expect(answer).resolves.toBeUndefined();
  });

  it("a modal one keeps the close button the extension chose, and has OK when it has none", async () => {
    const { api } = createNotificationsApi();
    const keep = { title: "Keep", isCloseAffordance: true };
    const choice = api.showWarningMessage<string | MessageItem>(
      "Sure?",
      { modal: true },
      "Remove",
      keep,
    );
    expect(notices[0]!.labels).toEqual(["Remove", "Keep"]);
    notices[0]!.answer(notices[0]!.closeIndex);
    await expect(choice).resolves.toBeUndefined();

    const info = api.showInformationMessage("Done", { modal: true });
    expect(notices[0]!.labels).toEqual(["OK"]);
    notices[0]!.answer(0);
    await expect(info).resolves.toBeUndefined();
  });

  it("dismissAll takes away only the messages of that extension", async () => {
    const a = createNotificationsApi("a");
    const b = createNotificationsApi("b");
    const fromA = a.api.showInformationMessage("A", "Ok");
    b.api.showInformationMessage("B", "Ok");
    a.dismissAll();
    await expect(fromA).resolves.toBeUndefined();
    expect(notices.map((n) => n.source)).toEqual(["b"]);
  });
});
