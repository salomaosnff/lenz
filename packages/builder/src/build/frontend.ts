import { ListrTask } from "listr2";
import { execaCommand as command } from "execa";
import { join } from "path";
import { copyFiles } from "../util";
import { isChanged } from "../hash";

export interface BuildFrontendOptions {
  input: string;
  output: string;
  noBuild: boolean;
  noCopy: boolean;
}

export function getBuildFrontendTasks(
  options: BuildFrontendOptions
): ListrTask[] {
  return [
    {
      title: "Transpilar frontend utilizando `pnpm build`",
      skip: () => options.noBuild,
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
      title: "Copiar arquivos de frontend",
      skip: () => options.noCopy,
      async task(_, task) {
        const source = join(options.input, "dist");

        await copyFiles(source, options.output);
      },
    },
  ];
}
