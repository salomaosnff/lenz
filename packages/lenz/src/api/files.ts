import fs from "node:fs/promises";

function createFileInput(cb: (input: any) => void) {
  return new Promise((resolve, reject) => {
    const input: any = document.createElement("input");

    input.type = "file";

    const onCancel = () => reject(new Error("User cancelled"));

    input.onchange = () => {
      window.removeEventListener("focus", onCancel);
      resolve(input.value)
    };

    cb(input)

    input.click();

    window.addEventListener("focus", onCancel, { once: true });
  });
}

export function showOpenFolderDialog() {
  return createFileInput(input => {
    input.nwdirectory = true;
  })
}

interface OpenFileDialogOptions {
  accept?: string
}

export function showOpenFileDialog(options: OpenFileDialogOptions = {}) {
  return createFileInput(input => {
    if (options.accept) {
      input.accept = options.accept;
    }
  })
}

interface SaveFileDialogOptions {
  suggest?: string
  accept?: string
  title?: string
}

interface SaveFolderDialogOptions {
  suggest?: string
  folder: true
  title?: string
}

type SaveDialogOptions = SaveFileDialogOptions | SaveFolderDialogOptions

function isFolderDialog(options: SaveDialogOptions): options is SaveFolderDialogOptions {
  return 'folder' in options && options.folder === true;
}

export function showSaveDialog(options: SaveDialogOptions = {}) {
  return createFileInput(input => {
    input.nwsaveas = options.suggest;
    input.nwdirectorydesc = options.title;
    
    if (isFolderDialog(options)) {
      input.nwdirectory = true;
    } else {
      input.accept = options.accept;
    }
  })
}

export function readFile(file: string) {
  return fs.readFile(file);
}

export function writeFile(file: string, data: string | Buffer) {
  return fs.writeFile(file, data);
}