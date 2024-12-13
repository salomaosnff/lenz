import { OpenFileDialog, SaveFileDialog } from "../www/file-dialog.lenz.es.js";
import { ref, createScope, watch } from "lenz:reactivity";
import { createWindow } from "lenz:ui";

export function openFile({
  title = "Abrir Arquivo",
  width = 640,
  height = 480,
  filters,
}) {
  return new Promise((resolve) => {
    const result = ref(null);
    const scope = createScope();

    const w = createWindow({
      title,
      width,
      height,
      content: (parent) => OpenFileDialog(parent, { result, filters }),
    });

    scope.run(() => {
      watch(result, (value) => {
        scope.dispose();

        w.close();
        resolve(value);
      });
    });
  });
}

export function saveFile({
  title = "Salvar Arquivo",
  width = 640,
  height = 480,
  filters,
}) {
  return new Promise((resolve) => {
    const result = ref(null);
    const scope = createScope();

    const w = createWindow({
      title,
      width,
      height,
      content: (parent) => SaveFileDialog(parent, { result, filters }),
    });

    scope.run(() => {
      watch(result, (value) => {
        scope.dispose();

        w.close();
        resolve(value);
      });
    });
  });
}
