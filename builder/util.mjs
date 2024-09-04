import { spawn } from "node:child_process";

export async function buildCargoProject(path) {
  return new Promise((resolve, reject) => {
    const process = spawn("cargo", ["build", "--release"], {
      stdio: "inherit",
      cwd: path,
    });

    process.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error("Cargo build failed"));
      }
    });

    process.on("error", (err) => {
      reject(err);
    });
  });
}
