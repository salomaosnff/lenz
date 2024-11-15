import { addCommand } from "lenz:commands";
import { addHotKeys } from "lenz:hotkeys";
import { extendMenu } from "lenz:menubar";
import { createWindow } from "lenz:ui";
import { ref, watch, createScope } from "lenz:reactivity";

// Ícones
import iconThemes from "lenz:icons/palette";

import {themeEditor, colorPicker} from "./www/theme.lenz.es.js"

export function activate({ subscriptions }) {
    let lastWindow;

    subscriptions.add(
        addHotKeys({
            "Alt+T": "color.themes"
        })
    );

    subscriptions.add(
        extendMenu(
            [
                {
                    id: "theme",
                    title: "Configurar Tema",
                    type: "item",
                    command: "color.themes",
                    icon: iconThemes,
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

                const doc = getCurrentDocument()

                const scope = createScope();

                let themeStyleEl = doc.head.querySelector('style#themes');

                
                if (!themeStyleEl) {
                    themeStyleEl = doc.createElement('style')
                    themeStyleEl.id = 'themes'
                    
                    doc.head.append(themeStyleEl)
                }
                
                const result = ref(themeStyleEl.textContent);
                
                scope.run(() => {
                    watch(result, async (style) => {
                        let themeStyleEl = getCurrentDocument().head.querySelector('style#themes');
                        themeStyleEl.textContent = style
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
}
