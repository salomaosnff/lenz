/// <reference types="../frontend/node_modules/@lenz-design/types" />

import { addCommand } from "lenz:commands";
import { addHotKeys } from "lenz:hotkeys";
import { extendMenu } from "lenz:menubar";
import { createWindow } from "lenz:ui";

// Ícones
import iconBorder from "lenz:icons/border_outside";

import BorderWindowWidget from "./www/border.lenz.es.js";

export function activate({ subscriptions }) {
  let currentWindow = null;

  subscriptions.add(
    addCommand({
      id: "css.border",
      name: "Configurar borda",
      icon: iconBorder,
      async run({ selection }) {
        if (currentWindow) {
          currentWindow.focus();
          return;
        }

        currentWindow = createWindow({
          title: "Configurar borda",
          width: 960,
          height: 480,
          content: (parent) =>
            BorderWindowWidget(parent, {
              selection,
              onUpdateStyle(style) {
                for (const { element } of selection.value) {
                  for (const [key, value] of Object.entries(style)) {
                    element.style.setProperty(key, value);
                  }
                }
              },
            }),
          onClose() {
            currentWindow = null;
          },
        });
      },
    })
  );

  subscriptions.add(
    extendMenu(
      [
        {
          id: "css.border",
          title: "Configurar borda",
          command: "css.border",
        },
      ],
      "tools"
    )
  );

  subscriptions.add(
    addHotKeys({
      "Ctrl+Shift+B": "css.border",
    })
  );
}
