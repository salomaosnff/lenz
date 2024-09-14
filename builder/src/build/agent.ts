import { Listr, ListrTask } from "listr2";
import { execaCommand as command } from "execa";
import { join } from "path";
import { copyFiles } from "../util";

export interface BuildAgentOptions {
  input: string;
  output: string;
  skipBin: boolean;
  skipBuild: boolean;
  skipResources: boolean;
}

export async function getBuildAgentTasks(
  options: BuildAgentOptions
): Promise<ListrTask[]> {
  return [
    {
      title: "Build agent backend",
      skip: () => options.skipBuild,
      task: async (_, task) => {
        const execute = command("cargo build --release", {
          cwd: join(options.input, "agent"),
        });

        execute.stdout.pipe(task.stdout());
        execute.stderr.pipe(task.stdout());

        await execute;
      },
    },
    {
      title: "Copy Binaries",
      skip: () => options.skipBin,
      task: async (_, task) => {
        const binSource = join(
          options.input,
          "agent",
          "target",
          "release",
          "lenz_server"
        );
        const binTarget = join(options.output, "bin", "lenz");

        for await (const message of copyFiles(binSource, binTarget)) {
          task.output = message;
        }
      },
    },
    {
      title: "Copy Resources",
      skip: () => options.skipResources,
      task: async (_, task) => {
        const resourcesSource = join(
          options.input,
          "agent",
          "server",
          "resources"
        );

        for await (const message of copyFiles(
          resourcesSource,
          join(options.output, "resources")
        )) {
          task.output = message;
        }
      },
    },
  ];
}
