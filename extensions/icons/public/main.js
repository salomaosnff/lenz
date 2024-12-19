/// <reference types="../frontend/node_modules/@lenz-design/types" />

import { addCommand } from "lenz:commands";
import { addHotKeys } from "lenz:hotkeys";
import { extendMenu } from "lenz:menubar";
import { createWindow } from "lenz:ui";

// Ícones
import iconInsertIcon from "lenz:icons/plus_box_outline";

import IconsWindowWidget from "./www/icons.lenz.es.js";

export function activate({ subscriptions }) {
  let currentWindow = null;

  subscriptions.add(
    addCommand({
      id: "svg.icon",
      name: "Inserir ícone SVG",
      icon: iconInsertIcon,
      async run({ selection, getCurrentDocument }) {
        if (currentWindow) {
          currentWindow.focus();
          return;
        }

        currentWindow = createWindow({
          title: "Inserir ícone SVG",
          width: 960,
          height: 480,
          content: (parent) =>
            IconsWindowWidget(parent, {
              selection,
              onInsert(path) {
                const icon = document.createElement("svg");

                icon.setAttribute("viewBox", "0 0 24 24");
                icon.setAttribute("fill", "currentColor");
                icon.setAttribute("width", "1.2em");
                icon.setAttribute("height", "1.2em");

                const pathElement = document.createElement("path");

                pathElement.setAttribute("d", path);

                icon.appendChild(pathElement);

                if (selection.value.length === 0) {
                  getCurrentDocument().body.appendChild(icon);
                  return;
                }

                for (const { element } of selection.value) {
                  element.appendChild(icon.cloneNode(true));
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
          id: "svg.icon",
          title: "Icone SVG",
          command: "svg.icon",
        },
      ],
      "insert"
    )
  );

  subscriptions.add(
    addHotKeys({
      "Ctrl+Shift+I": "svg.icon",
    })
  );
}
