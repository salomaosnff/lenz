import { execSync } from "child_process";
import config from "./config.mjs";

export function execHook(name) {
  if (!config.hooks[name]) {
    return;
  }

  for (const command of [].concat(config.hooks[name])) {
    execSync(command, {
      stdio: "inherit",
      env: process.env,
    });
  }
}
