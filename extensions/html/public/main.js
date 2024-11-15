import { addCommand } from "lenz:commands";
import { addHotKeys } from "lenz:hotkeys";
import { extendMenu } from "lenz:menubar";

import * as allCommands from "./commands.js";
import { getMenuBar } from "./menubar.js";

export function activate({ subscriptions }) {
  const hotkeys = {};

  for (const getCommand of Object.values(allCommands)) {
    const { hotKey, ...command } = getCommand();

    if (hotKey) {
      hotkeys[hotKey] = command.id;
    }

    subscriptions.add(addCommand(command));
  }

  subscriptions.add(addHotKeys(hotkeys));

  for (const [parent, menu] of Object.entries(getMenuBar())) {
    subscriptions.add(extendMenu(menu, parent));
  }
}
