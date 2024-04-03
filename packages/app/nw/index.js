const { NW_URL = "package.nw/app/dist/index.html" } = process.env;

process.chdir(nw.App.getStartPath());

nw.Window.open(
  NW_URL,
  {
    show: false,
    width: 1024,
    height: 768,
  },
  async (win) => {
    // Maximize the window
    win.setPosition("center");
    win.maximize();
  }
);

globalThis.LENZ_PATH = require.resolve("lenz/api");