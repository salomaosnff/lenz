import type { MessageOptions } from "lenz-sdk";
import { notifications } from "../../notifications";
import { prompts } from "../../prompts";
import {
  boolean,
  flag,
  optionalText,
  schema,
  string,
  text,
  textList,
  type Input,
  type Tools,
} from "./input";

type Severity = "info" | "warning" | "error";

const severityProperty = {
  type: "string",
  enum: ["info", "warning", "error"],
  description: "Defaults to info.",
};

function severityOf(input: Input): Severity {
  const value = input.severity ?? "info";
  if (value !== "info" && value !== "warning" && value !== "error") {
    throw new Error('"severity" must be "info", "warning" or "error".');
  }
  return value;
}

/** Shows a message of the given severity, with buttons if any, and gives what the user chose. */
function show(severity: Severity, message: string, options: MessageOptions, ...items: string[]) {
  if (severity === "warning") return notifications.showWarningMessage(message, options, ...items);
  if (severity === "error") return notifications.showErrorMessage(message, options, ...items);
  return notifications.showInformationMessage(message, options, ...items);
}

export const dialogTools: Tools = [
  {
    name: "notify_user",
    description:
      "Shows the user a short notification in the corner of the window, which goes away by itself. It does not wait for anything.",
    inputSchema: schema({ message: string("What to say."), severity: severityProperty }, [
      "message",
    ]),
    execute(input) {
      void show(severityOf(input), text(input, "message"), {});
      return "Shown.";
    },
  },
  {
    name: "ask_user_choice",
    description:
      "Asks the user to pick one of a few buttons in a dialog, and waits. Use it before something the user may not want. The answer is the chosen button, or null if the user closed the dialog.",
    inputSchema: schema(
      {
        message: string("The question."),
        options: { type: "array", items: { type: "string" }, description: "The buttons." },
        detail: string("More text under the question."),
        severity: severityProperty,
      },
      ["message", "options"],
    ),
    async execute(input) {
      const answer = await show(
        severityOf(input),
        text(input, "message"),
        { modal: true, detail: optionalText(input, "detail") },
        ...textList(input, "options"),
      );
      return { answer: answer ?? null };
    },
  },
  {
    name: "ask_user_text",
    description:
      "Asks the user to type a text, and waits. The answer is the text, or null if the user gave up.",
    inputSchema: schema({
      title: string("Shown above the box."),
      prompt: string("Tells what to type."),
      placeholder: string("Shown while the box is empty."),
      value: string("What the box starts with."),
    }),
    async execute(input) {
      const answer = await prompts.showInputBox({
        title: optionalText(input, "title"),
        prompt: optionalText(input, "prompt"),
        placeHolder: optionalText(input, "placeholder"),
        value: optionalText(input, "value"),
      });
      return { answer: answer ?? null };
    },
  },
  {
    name: "ask_user_pick",
    description:
      "Shows the user a filterable list to pick from, and waits. The answer is what was picked (a list with multiple), or null if the user gave up.",
    inputSchema: schema(
      {
        items: { type: "array", items: { type: "string" }, description: "What to pick from." },
        placeholder: string("Shown in the filter box."),
        multiple: boolean("Let the user check several. Defaults to false."),
      },
      ["items"],
    ),
    async execute(input) {
      const items = textList(input, "items");
      const placeHolder = optionalText(input, "placeholder");
      const answer = flag(input, "multiple")
        ? await prompts.showQuickPick(items, { placeHolder, canPickMany: true })
        : await prompts.showQuickPick(items, { placeHolder });
      return { answer: answer ?? null };
    },
  },
];
