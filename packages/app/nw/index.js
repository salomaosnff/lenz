
const { NW_URL = 'package.nw/app/dist/index.html' } = process.env;

nw.Window.open(NW_URL, {
  frame: false,
  resizable: false,
  show: false,
  width: 480,
  height: 320,
}, async (win) => {
  // Maximize the window
  win.setPosition('center');
  win.setAlwaysOnTop(true);

  win.on('loaded', () => win.show());
});
