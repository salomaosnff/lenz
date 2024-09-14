import { execaCommand as command } from "execa";
import { mkdir } from "fs/promises";
import { ListrTask } from "listr2";
import { join } from "path";
import { setTimeout } from "timers/promises";

export interface PackArchiveOptions {
  input: string;
  output: string;
  noTarGz: boolean;
  noZip: boolean;
  noTarXz: boolean;
}

export async function getPackArquiveTasks(options: PackArchiveOptions): Promise<ListrTask[]> {
  const prefix = "lenz-designer-linux-x64";

  await mkdir(options.output, { recursive: true });

  return [
    {
      title: "Create tar.gz archive",
      skip: () => options.noTarGz,
      async task(_, task) {
        const archiveFilename = join(options.output, `${prefix}.tar.gz`);

        const execute = command(`tar -czvf ${archiveFilename} ${options.input}`);

        execute.stdout.pipe(task.stdout());
        execute.stderr.pipe(task.stdout());

        await execute;
      },
    },
    {
      title: "Create zip archive",
      skip: () => options.noZip,
      async task(_, task) {
        const archiveFilename = join(options.output, `${prefix}.zip`);

        const execute = command(`zip -r ${archiveFilename} ${options.input}`);

        execute.stdout.pipe(task.stdout());
        execute.stderr.pipe(task.stdout());

        await execute;
      },
    },
    {
      title: "Create tar.xz archive",
      skip: () => options.noTarXz,
      async task(_, task) {
        const archiveFilename = join(options.output, `${prefix}.tar.xz`);

        const execute = command(`tar -cJvf ${archiveFilename} ${options.input}`);

        execute.stdout.pipe(task.stdout());
        execute.stderr.pipe(task.stdout());

        await execute;
      },
    },
  ];
}
