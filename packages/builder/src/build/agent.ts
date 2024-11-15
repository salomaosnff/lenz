import { ListrTask } from "listr2";
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
      title: "Construir agente utilizando cargo",
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
      title: "Copiar binário do agente",
      skip: () => options.skipBin,
      task: async () => {
        const binSource = join(
          options.input,
          "agent",
          "target",
          "release",
          "lenz_server"
        );
        const binTarget = join(options.output, "bin", "lenz");

        await copyFiles(binSource, binTarget)
      },
    },
    {
      title: "Copiar recursos do agente",
      skip: () => options.skipResources,
      task: async () => {
        const resourcesSource = join(options.input, "agent", "server", "resources");
        const resourcesTarget = join(options.output, "resources");

        await copyFiles(resourcesSource, resourcesTarget)
      },
    }
  ];
}
