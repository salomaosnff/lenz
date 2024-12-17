/// <reference types="../frontend/node_modules/@lenz-design/types" />

import { addCommand } from "lenz:commands";
import { write } from "lenz:file";
import { addHotKeys } from "lenz:hotkeys";
import { extendMenu } from "lenz:menubar";
import { createWindow } from "lenz:ui";
import { ref, watch, createScope } from "lenz:reactivity";
import { prompt } from "lenz:dialog";

// Ícones
import iconFont from "lenz:icons/format_font";

import FontWindowWidget from "./www/font.lenz.es.js";

export function activate({ subscriptions }) {
  let currentWindow = null;

  subscriptions.add(
    addCommand({
      id: "css.font",
      name: "Configurar fonte",
      icon: iconFont,
      async run({ selection, getCurrentDocument }) {
        if (currentWindow) {
          currentWindow.focus();
          return;
        }

        currentWindow = createWindow({
          title: "Configurar fonte",
          width: 960,
          height: 480,
          content: (parent) =>
            FontWindowWidget(parent, {
              selection,
              getCurrentDocument,
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
          id: "css.font",
          title: "Configurar fonte",
          command: "css.font",
        },
      ],
      "tools"
    )
  );

  subscriptions.add(
    addHotKeys({
      F12: "css.font",
    })
  );
}
