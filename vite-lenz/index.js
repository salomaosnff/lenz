import { spawn } from "child_process";
import { createConnection } from "net";

function waitForPort(port) {
  return new Promise((resolve, reject) => {
    const timeout = 10000;
    const start = Date.now();

    function check() {
      const now = Date.now();

      if (now - start > timeout) {
        reject(new Error(`Timeout waiting for port ${port}`));
        return;
      }

      const socket = createConnection({ port });

      socket.once("error", () => {
        setTimeout(check, 100);
      });

      socket.once("connect", () => {
        socket.end();
        resolve();
      });
    }

    check();
  });
}

function startLenz() {
  return new Promise((resolve, reject) => {
    console.log("Inicializando o Lenz...");
    const lenz = spawn("lenz", ["--no-browser"]);

    lenz.addListener("error", reject);
    lenz.addListener("exit", (code) => {
      console.log(`O processo do Lenz foi encerrado com código ${code}`);
      reject(new Error(`O processo do Lenz foi encerrado com código ${code}`));
    });
    lenz.addListener("spawn", () => {
      waitForPort(5369).then(resolve).catch(reject);
    });
  });
}

async function ensureLenz() {
  let retries = 3;

  do {
    const imports = await fetch("http://localhost:5369/importmap.json")
      .then((res) => res.json())
      .then((data) => Object.keys(data))
      .catch(() => false);

    if (imports) {
      return new Set(imports);
    }

    await startLenz();
  } while (retries-- > 0);
}

/**
 *
 * @returns {import('vite').Plugin}
 */
export function Lenz() {
  let modules = new Set();

  const modulePrefixTransform = ({ base }) => ({
    name: "vite-plugin-remove-prefix",
    transform: (code) => {
      // Verify if there are any external modules resolved to avoid having /\/@id\/()/g regex
      if (modules.size === 0) return code;

      const viteImportAnalysisModulePrefix = "@id/";
      const prefixedImportRegex = new RegExp(
        `${base}${viteImportAnalysisModulePrefix}(${[...modules].join(
          "|"
        )})`,
        "g"
      );

      if (prefixedImportRegex.test(code)) {
        // eslint-disable-next-line unicorn/prefer-string-replace-all
        return code.replace(
          prefixedImportRegex,
          (_, externalName) => externalName
        );
      }
      return code;
    },
  });

  return {
    name: "lenz-externalize",
    enforce: "pre",
    async config(config) {
      config.optimizeDeps ??= {};
      config.optimizeDeps.esbuildOptions ??= {};
      config.optimizeDeps.esbuildOptions.plugins ??= [];

      config.build ??= {};
      config.build.rollupOptions ??= {};

      // Prevent the plugin from being inserted multiple times
      const pluginName = "lenz-externalize";
      const isPluginAdded = config.optimizeDeps.esbuildOptions.plugins.some(
        (plugin) => plugin.name === pluginName
      );

      if (!isPluginAdded) {
        modules = await ensureLenz();
        const originalExternal = config.build.rollupOptions.external ?? [];

        function isExternal(
          source,
          importer,
          isResolved,
          external = originalExternal
        ) {
          if (typeof external === "string") {
            return source === external;
          }

          if (external instanceof RegExp) {
            return external.test(source);
          }

          if (Array.isArray(external)) {
            return external.some((ext) =>
              isExternal(source, importer, isResolved, ext)
            );
          }

          if (typeof external === "function") {
            return external(source, importer, isResolved, external) ?? false;
          }

          return false;
        }

        config.build.rollupOptions.external = (
          source,
          importer,
          isResolved
        ) => {
          if (source.startsWith("lenz:")) {
            return true;
          }

          return isExternal(source, importer, isResolved);
        };

        config.optimizeDeps.esbuildOptions.plugins.push({
          name: pluginName,
          setup(build) {
            build.onResolve({ filter: /^lenz:/ }, (args) => {
              if (modules.has(args.path)) {
                return {
                  path: args.path,
                  external: true,
                };
              }

              return null;
            });

            // Supresses the following error:
            // Do not know how to load path: [namespace:moduleName]
            build.onLoad({ filter: /^lenz:/ }, (args) => {
              if (modules.has(args.path)) {
                return { contents: "" };
              }

              return null;
            });
          },
        });
      }
    },
    configResolved(config) {
      config.plugins.push(
        modulePrefixTransform({ base: config.base ?? "/" })
      );
    },
    resolveId(id) {
      if (id.startsWith("lenz:")) {
        return {
          id,
          external: true,
        };
      }
    },
    load(id) {
      if (modules.has(id)) {
        return { code: "export default {};" };
      }
    },
    transformIndexHtml(html) {
      return {
        html,
        tags: [
          {
            tag: "script",
            injectTo: "head-prepend",
            attrs: {
              src: "http://localhost:5369/lenz-init.js",
            },
          },
        ],
      };
    },
  };
}

export default Lenz;
