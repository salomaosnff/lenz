
const { NW_URL = 'package.nw/app/dist/index.html' } = process.env;

nw.Window.open(NW_URL, {
  width: 1024,
  height: 768,
  frame: true,
  resizable: true,
  show: false,
}, (win) => {
  win.setPosition('center');

  win.on('loaded', () => win.show());
});
