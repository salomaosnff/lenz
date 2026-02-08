import { execaCommand as command } from "execa";
import { ensureDir } from "fs-extra";
import { ListrTask } from "listr2";
import { join } from "path";

export interface PackArchiveOptions {
  input: string;
  output: string;
  noTarGz: boolean;
  noZip: boolean;
  noTarXz: boolean;
}

export async function getPackArquiveTasks(options: PackArchiveOptions): Promise<ListrTask[]> {
  const prefix = "lenz-designer";

  await ensureDir(options.output);

  return [
    {
      title: "Criar pacote tar.gz",
      skip: () => options.noTarGz,
      async task(_, task) {
        const archiveFilename = join(options.output, `${prefix}.tar.gz`);

        const execute = command(`tar -czvf ${archiveFilename} -C ${options.input} .`);

        execute.stdout.pipe(task.stdout());
        execute.stderr.pipe(task.stdout());

        await execute;
      },
    },
    // {
    //   title: "Criar pacote zip",
    //   skip: () => options.noZip,
    //   async task(_, task) {
    //     const archiveFilename = join(options.output, `${prefix}.zip`);

    //     const execute = command(`zip -r ${archiveFilename} ${options.input}`);

    //     execute.stdout.pipe(task.stdout());
    //     execute.stderr.pipe(task.stdout());

    //     await execute;
    //   },
    // },
    {
      title: "Criar pacote tar.xz",
      skip: () => options.noTarXz,
      async task(_, task) {
        const archiveFilename = join(options.output, `${prefix}.tar.xz`);

        const execute = command(`tar -cJvf ${archiveFilename} -C ${options.input} .`);

        execute.stdout.pipe(task.stdout());
        execute.stderr.pipe(task.stdout());

        await execute;
      },
    },
  ];
}
