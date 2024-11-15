import { ListrTask } from "listr2";
import { execaCommand as command } from "execa";
import { join } from "path";
import { copyFiles } from "../util";

export interface Options {
  input: string;
  output: string;
  esm: boolean;
  esmCopy: boolean;
  copyTypes: boolean;
}

export function getBuildEsmTasks(options: Options): ListrTask[] {
  return [
    {
      title: "Transpilar módulos ECMAScript do agente",
      skip: () => !options.esm,
      async task(_, task) {
        task.output = "Instalando dependências...";
        const install = command("pnpm install", {
          cwd: options.input,
        });

        install.stdout.pipe(task.stdout());
        install.stderr.pipe(task.stdout());

        await install;

        task.output = "Executando `pnpm build`...";
        const execute = command("pnpm build", {
          cwd: options.input,
        });

        execute.stdout.pipe(task.stdout());
        execute.stderr.pipe(task.stdout());

        await execute;
      },
    },
    {
      title: "Copiar módulos ECMAScript do agente",
      skip: () => !options.esmCopy,
      async task() {
        const sourceDir = join(options.input, "dist");
        const targetDir = join(options.output, "esm");

        await copyFiles(sourceDir, targetDir);
      },
    },
    {
      title: "Copiar arquivos de tipos dos módulos ECMAScript do agente",
      skip: () => !options.copyTypes,
      async task() {
        const sourceDir = join(options.input, "../esm-types/index.d.ts");
        const targetDir = join(options.output, "types");

        await copyFiles(sourceDir, targetDir);
      },
    },
  ];
}
