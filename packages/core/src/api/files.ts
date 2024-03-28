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
}

export function showSaveFileDialog(options: SaveFileDialogOptions = {}) {
  return createFileInput(input => {
    if (options.accept) {
      input.accept = options.accept;
      input.nwsaveas = options.suggest;
    }
  })
}