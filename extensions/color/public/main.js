import { addCommand } from "lenz:commands";
import { addHotKeys } from "lenz:hotkeys";
import { extendMenu } from "lenz:menubar";
import { createWindow } from "lenz:ui";
import { prompt, searchSuggestions } from 'lenz:dialog';
import { ref, watch, createScope } from "lenz:reactivity";

// Ícones
import iconThemes from "lenz:icons/palette";

import { themeEditor, colorPicker } from "./www/theme.lenz.es.js";
import { getAllColors } from "./index.js";

export function activate({ subscriptions }) {
  let lastWindow;

  subscriptions.add(
    addHotKeys({
      "Alt+T": "color.themes",
      "C": "css.color.text",
      "B": "css.color.background",
    })
  );

  subscriptions.add(
    extendMenu(
      [
        {
          id: "css.colors",
          title: "Cores e Temas",
          type: "group",
          icon: iconThemes,
          children: [
            {
              id: "theme",
              title: "Configurar Tema",
              type: "item",
              icon: iconThemes,
              command: "color.themes",
            },
            {
              id: "css.color.background",
              title: "Definir cor de fundo",
              type: "item",
              icon: iconThemes,
              command: "css.color.background",
            },
            {
              id: "css.color.text",
              title: "Definir cor do texto",
              type: "item",
              icon: iconThemes,
              command: "css.color.text",
            }
          ],
        },
      ],
      "tools"
    )
  );

  subscriptions.add(
    addCommand({
      id: "color.themes",
      name: "Configuração de Tema",
      icon: iconThemes,
      async run({ getCurrentDocument }) {
        if (lastWindow) {
          lastWindow.focus();
          return;
        }

        const doc = getCurrentDocument();

        const scope = createScope();

        let themeStyleEl = doc.head.querySelector("style#themes");

        if (!themeStyleEl) {
          themeStyleEl = doc.createElement("style");
          themeStyleEl.id = "themes";

          doc.head.append(themeStyleEl);
        }

        const result = ref(themeStyleEl.textContent);

        scope.run(() => {
          watch(result, async (style) => {
            let themeStyleEl =
              getCurrentDocument().head.querySelector("style#themes");
            themeStyleEl.textContent = style;
          });
        });

        lastWindow = createWindow({
          width: 840,
          height: 390,
          themed: true,
          title: "Configurações de Tema",
          content: (parent) => themeEditor(parent, { result }),
          onClose() {
            scope.dispose();
            lastWindow = null;
          },
        });
      },
    })
  );

  subscriptions.add(
    addCommand({
      id: "css.color.background",
      name: "Definir cor de fundo",
      icon: iconThemes,
      async run({ getCurrentDocument, selection }) {
        const doc = getCurrentDocument();
        const suggestions = getAllColors(doc);

        const color = await prompt({
          message: "Escolha uma cor",
          getSuggestions: searchSuggestions(suggestions),
        })

        if (!color) return;

        for (const { element } of selection.value) {
          element.style.setProperty("background-color", color);
        }
      },
    })
  )

  subscriptions.add(
    addCommand({
      id: "css.color.text",
      name: "Definir cor do texto",
      icon: iconThemes,
      async run({ getCurrentDocument, selection }) {
        const doc = getCurrentDocument();
        const suggestions = getAllColors(doc);

        const color = await prompt({
          message: "Escolha uma cor",
          getSuggestions: searchSuggestions(suggestions),
        })

        if (!color) return;

        for (const { element } of selection.value) {
          element.style.setProperty("color", color);
        }
      },
    })
  )
}
