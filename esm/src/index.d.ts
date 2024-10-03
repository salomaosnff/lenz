import * as util from "./util";
import * as ui from "./ui";
import * as types from "./types";
import * as menubar from "./menubar";
import * as invoke from "./invoke";
import * as hotkeys from "./hotkeys";
import * as hooks from "./hooks";
import * as history from "./history";
import * as file from "./file";
import * as dialog from "./dialog";
import * as commands from "./commands";

declare module "lenz:commands" {
  export = commands;
}

declare module "lenz:dialog" {
  export = dialog;
}

declare module "lenz:file" {
  export = file;
}

declare module "lenz:history" {
  export = history;
}

declare module "lenz:hooks" {
  export = hooks;
}

declare module "lenz:hotkeys" {
  export = hotkeys;
}

declare module "lenz:invoke" {
  export = invoke;
}

declare module "lenz:menubar" {
  export = menubar;
}

declare module "lenz:types" {
  export = types;
}

declare module "lenz:ui" {
  export = ui;
}

declare module "lenz:util" {
  export = util;
}
