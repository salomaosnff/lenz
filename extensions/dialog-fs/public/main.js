import { addCommand } from "lenz:commands";
import { createWindow } from "lenz:ui";
import { ref, watch, createScope } from "lenz:reactivity";

import { FileDialog } from "./www/file-dialog.lenz.es.js";

export async function activate({ subscriptions }) {
  let windowAlreadyOpen = false;

  subscriptions.add(
    addCommand({
      id: "dialog.file.open",
      name: "Abrir janela de seleção de arquivo",
      description: "Abre a janela de seleção de arquivo",
      run() {
        return new Promise((resolve, reject) => {
          if (windowAlreadyOpen) {
            return reject(
              new Error("Há uma janela de seleção de arquivo aberta")
            );
          }

          windowAlreadyOpen = true;

          const result = ref(null);
          const scope = createScope();

          const w = createWindow({
            title: "Abrir arquivo HTML",
            width: 640,
            height: 480,
            content: (parent) =>
              FileDialog(parent, {
                result,
                filters: {
                  "Páginas HTML": "*.html",
                },
              }),
          });

          scope.run(() => {
            watch(result, (value) => {
              scope.dispose();

              w.close();
              windowAlreadyOpen = false;
              resolve(value);
            });
          });
        });
      },
    })
  );
}
