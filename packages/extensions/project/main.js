const lenz = require("lenz");
const EventEmitter = require("node:events");
const fsAsync = require("node:fs/promises");

function activate({ subscriptions }) {
  const events = new EventEmitter();
  let currentProject = null;

  async function open(projectPath) {
    if (!projectPath) {
      projectPath = await lenz.files.showOpenFolderDialog({
        title: "Selecione a pasta do projeto",
      });
    }

    currentProject = projectPath;

    events.emit("open", projectPath);
  }

  async function create(projectPath) {
    if (!projectPath) {
      projectPath = await lenz.files.showSaveDialog({
        folder: true,
        title: "Selecione a pasta do projeto",
        suggest: "Nome do projeto",
      });

      await fsAsync.mkdir(projectPath, { recursive: true });
    }

    return open(projectPath);
  }

  async function writeFile(path, content) {
    await fsAsync.writeFile(path, content);
  }

  async function readFile(path) {
    return await fsAsync.readFile(path, "utf-8");
  }

  async function deleteFile(path) {
    return await fsAsync.unlink(path, { recursive: true });
  }

  subscriptions.add(lenz.commands.registerCommand("project.open", open));
  subscriptions.add(lenz.commands.registerCommand("project.new", create));
  subscriptions.add(lenz.commands.registerCommand("project.new.from-template", () => alert("Not implemented yet")));

  return {
    events,
    open,
    writeFile,
    readFile,
    deleteFile,
    getProjectPath() {
      return currentProject;
    }
  };
}

module.exports = {
  activate,
};
