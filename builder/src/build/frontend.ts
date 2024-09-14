import { ListrTask } from "listr2";
import { execaCommand as command } from "execa";
import { join } from "path";
import { copyFiles } from "../util";

export interface BuildFrontendOptions {
    input: string;
    output: string;
    noBuild: boolean;
    noCopy: boolean;
}

export function getBuildFrontendTasks(options: BuildFrontendOptions): ListrTask[] {
    return [
        {
            title: "Build frontend",
            skip: () => options.noBuild,
            async task(_, task) {
                const execute = command("pnpm run build", {
                    cwd: options.input,
                });

                execute.stdout.pipe(task.stdout());
                execute.stderr.pipe(task.stdout());

                await execute;
            }
        },
        {
            title: "Copy build files",
            skip: () => options.noCopy,
            async task(_, task) {
                const source = join(options.input, "dist");

                for await (const message of copyFiles(source, options.output)) {
                    task.output = message;
                }
            }
        }
    ]
}