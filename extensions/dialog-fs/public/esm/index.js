import { OpenFileDialog, SaveFileDialog } from "../www/file-dialog.lenz.es.js";
import { createWindow } from "lenz:ui";

export function openFile({
  title = "Abrir Arquivo",
  width = 640,
  height = 480,
  filters,
}) {
  return new Promise((resolve) => {
    const w = createWindow({
      title,
      width,
      height,
      content: (parent) =>
        OpenFileDialog(parent, {
          filters,
          onResult(value) {
            w.close();
            resolve(value);
          },
        }),
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
    const w = createWindow({
      title,
      width,
      height,
      content: (parent) =>
        SaveFileDialog(parent, {
          onResult(result) {
            console.log("result", result);
            w.close();
            resolve(result);
          },
          filters,
        }),
    });
  });
}
