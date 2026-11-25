/**
 * The `package.json` an extension ships in its build folder, as in VS Code: it says which file is
 * the extension (`main`) and what it adds to the app (`contributes`) without running any of its code.
 */

/** A command for the palette. Its `run` is registered by the extension, with `registerCommand`. */
export interface CommandContribution {
  /** The command id, unique across the app; prefix it with the extension name. */
  command: string;
  title: string;
  category?: string;
  /** Icon name, e.g. `lucide:copy`. */
  icon?: string;
  /** Condition for the command to be available; see `ViewProvider.when`. */
  when?: string;
}

/**
 * A tool for AI agents (through WebMCP). Its `execute` is registered by the extension, with
 * `registerTool`; until it is, an agent that calls it waits for the extension to start.
 */
export interface ToolContribution {
  /** Unique across the app, letters, digits, `_`, `.` and `-`; prefix it with the extension name. */
  name: string;
  title?: string;
  /** Said to the agent: what the tool does and when to use it. */
  description: string;
  /** A JSON Schema (`type: "object"`) for what the tool takes. Without one it takes no input. */
  inputSchema?: Record<string, unknown>;
  /** The tool changes nothing. */
  readOnly?: boolean;
  /** The tool does something that is hard to undo, so the agent should be careful with it. */
  consequential?: boolean;
}

/** A keyboard shortcut for a command; see `Keybinding`. */
export interface KeybindingContribution {
  key: string;
  command: string;
  when?: string;
  args?: unknown[];
}

/** A panel of the activity bar. */
export interface ViewContainerContribution {
  id: string;
  title: string;
  /** Icon name of the activity bar button. */
  icon: string;
  /**
   * Where the button goes in the activity bar, by default: the lower the number, the higher it is.
   * The panels of the app are at 0 (Explorer) and 50 (Extensions); without a number a panel goes
   * after them, at 100. The user can still move it.
   */
  order?: number;
}

/** A view inside a container. Its content is supplied by `registerViewProvider`. */
export interface ViewContribution {
  id: string;
  name: string;
  when?: string;
  collapsed?: boolean;
  /**
   * The view starts at the height of its content instead of sharing the panel, so a short list is
   * not squeezed by a long view next to it. The user can still resize it.
   */
  autoHeight?: boolean;
}

/** An editor for files: what the editor switcher shows and which files it applies to. */
export interface EditorContribution {
  /** Unique across the app, e.g. `my-extension.visual`. Also what `activeEditor` is set to. */
  id: string;
  /** Shown on the editor switcher. */
  label: string;
  /** Icon name, e.g. `lucide:eye`. */
  icon?: string;
  /** File name patterns, case-insensitive, `*` matches any run of characters. */
  selector: string[];
  /** `default` editors are what a file opens with; `option` ones are alternatives. */
  priority?: "default" | "option";
}

/** A page: a tab of the editor area that is not a file. Its content is supplied by `registerPageProvider`. */
export interface PageContribution {
  /** Unique across the app, e.g. `my-game.board`. Pass it to `pages.open`. */
  id: string;
  /** Shown on the tab. */
  title: string;
  /** Icon name, e.g. `lucide:gamepad-2`. */
  icon?: string;
}

/**
 * Everything an extension adds to the app. It is also everything it is allowed to add: the app
 * refuses to register a command, a view provider or an editor that is not declared here.
 */
export interface Contributes {
  commands?: CommandContribution[];
  editors?: EditorContribution[];
  pages?: PageContribution[];
  keybindings?: KeybindingContribution[];
  tools?: ToolContribution[];
  viewsContainers?: { activitybar?: ViewContainerContribution[] };
  /** Views by the id of the container they go into: one of `viewsContainers`, or one of the app. */
  views?: Record<string, ViewContribution[]>;
}

export interface ExtensionManifest {
  /** The extension id. It is also the name of its folder. */
  name: string;
  displayName?: string;
  version: string;
  description?: string;
  /** The built file that holds the extension, relative to the folder of the manifest. */
  main: string;
  /** Ids of the extensions that must be active before this one. */
  extensionDependencies?: string[];
  contributes?: Contributes;
}

export class InvalidManifestError extends Error {}

const fail = (where: string, message: string): never => {
  throw new InvalidManifestError(`${where}: ${message}`);
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

function text(where: string, value: unknown, field: string, required = true): string | undefined {
  if (value === undefined && !required) return undefined;
  if (typeof value !== "string" || !value.trim()) return fail(where, `"${field}" must be a text.`);
  return value;
}

function list<T>(
  where: string,
  value: unknown,
  field: string,
  each: (item: unknown, at: string) => T,
): T[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return fail(where, `"${field}" must be a list.`);
  return value.map((item, i) => each(item, `${where} ${field}[${i}]`));
}

const object = (where: string, item: unknown): Record<string, unknown> =>
  isObject(item) ? item : fail(where, "must be an object.");

/** A path inside the folder of the manifest: not absolute, and not climbing out of it. */
function isLocalPath(path: string) {
  return !/^([a-z][a-z0-9+.-]*:|\/|\\)/i.test(path) && !path.split(/[\\/]/).includes("..");
}

/**
 * Checks a `package.json` that came from outside and keeps only what the app understands. Throws
 * `InvalidManifestError` naming the field that is wrong, so a broken extension says why.
 */
export function parseManifest(data: unknown): ExtensionManifest {
  const root = "package.json";
  const file = object(root, data);
  const name = text(root, file.name, "name")!;
  const main = text(root, file.main, "main")!;
  if (!isLocalPath(main)) fail(root, '"main" must be a path inside the extension folder.');
  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(name))
    fail(root, '"name" can only have letters, digits, ".", "_" and "-".');

  const manifest: ExtensionManifest = {
    name,
    version: text(root, file.version, "version")!,
    main,
  };
  const displayName = text(root, file.displayName, "displayName", false);
  const description = text(root, file.description, "description", false);
  if (displayName) manifest.displayName = displayName;
  if (description) manifest.description = description;
  if (file.extensionDependencies !== undefined) {
    manifest.extensionDependencies = list(
      root,
      file.extensionDependencies,
      "extensionDependencies",
      (item, at) => text(at, item, "item")!,
    );
  }
  if (file.contributes === undefined) return manifest;

  const contributes = object(`${root} contributes`, file.contributes);
  const where = `${root} contributes`;
  const result: Contributes = {};

  if (contributes.commands !== undefined) {
    result.commands = list(where, contributes.commands, "commands", (raw, at) => {
      const item = object(at, raw);
      const command: CommandContribution = {
        command: text(at, item.command, "command")!,
        title: text(at, item.title, "title")!,
      };
      for (const key of ["category", "icon", "when"] as const) {
        const value = text(at, item[key], key, false);
        if (value !== undefined) command[key] = value;
      }
      return command;
    });
  }

  if (contributes.editors !== undefined) {
    result.editors = list(where, contributes.editors, "editors", (raw, at) => {
      const item = object(at, raw);
      const editor: EditorContribution = {
        id: text(at, item.id, "id")!,
        label: text(at, item.label, "label")!,
        selector: list(at, item.selector, "selector", (pattern, inner) =>
          text(inner, pattern, "pattern")!,
        ),
      };
      if (!editor.selector.length) fail(at, '"selector" needs at least one pattern.');
      const icon = text(at, item.icon, "icon", false);
      if (icon !== undefined) editor.icon = icon;
      if (item.priority !== undefined) {
        if (item.priority !== "default" && item.priority !== "option")
          fail(at, '"priority" must be "default" or "option".');
        editor.priority = item.priority as "default" | "option";
      }
      return editor;
    });
  }

  if (contributes.pages !== undefined) {
    result.pages = list(where, contributes.pages, "pages", (raw, at) => {
      const item = object(at, raw);
      const page: PageContribution = {
        id: text(at, item.id, "id")!,
        title: text(at, item.title, "title")!,
      };
      const icon = text(at, item.icon, "icon", false);
      if (icon !== undefined) page.icon = icon;
      return page;
    });
  }

  if (contributes.keybindings !== undefined) {
    result.keybindings = list(where, contributes.keybindings, "keybindings", (raw, at) => {
      const item = object(at, raw);
      const binding: KeybindingContribution = {
        key: text(at, item.key, "key")!,
        command: text(at, item.command, "command")!,
      };
      const when = text(at, item.when, "when", false);
      if (when !== undefined) binding.when = when;
      if (item.args !== undefined) {
        if (!Array.isArray(item.args)) fail(at, '"args" must be a list.');
        binding.args = item.args as unknown[];
      }
      return binding;
    });
  }

  if (contributes.tools !== undefined) {
    result.tools = list(where, contributes.tools, "tools", (raw, at) => {
      const item = object(at, raw);
      const tool: ToolContribution = {
        name: text(at, item.name, "name")!,
        description: text(at, item.description, "description")!,
      };
      if (!/^[a-z][a-z0-9_.-]{0,127}$/i.test(tool.name))
        fail(
          at,
          '"name" must start with a letter and have only letters, digits, "_", "." and "-".',
        );
      const title = text(at, item.title, "title", false);
      if (title !== undefined) tool.title = title;
      if (item.inputSchema !== undefined) {
        const schema = object(at, item.inputSchema);
        if (schema.type !== "object") fail(at, '"inputSchema" must have type "object".');
        tool.inputSchema = schema;
      }
      for (const key of ["readOnly", "consequential"] as const) {
        if (item[key] === undefined) continue;
        if (typeof item[key] !== "boolean") fail(at, `"${key}" must be true or false.`);
        tool[key] = item[key] as boolean;
      }
      return tool;
    });
  }

  if (contributes.viewsContainers !== undefined) {
    const containers = object(`${where} viewsContainers`, contributes.viewsContainers);
    result.viewsContainers = {
      activitybar: list(
        `${where} viewsContainers`,
        containers.activitybar,
        "activitybar",
        (raw, at) => {
          const item = object(at, raw);
          const container: ViewContainerContribution = {
            id: text(at, item.id, "id")!,
            title: text(at, item.title, "title")!,
            icon: text(at, item.icon, "icon")!,
          };
          if (item.order !== undefined) {
            if (typeof item.order !== "number" || !Number.isFinite(item.order))
              fail(at, '"order" must be a number.');
            container.order = item.order as number;
          }
          return container;
        },
      ),
    };
  }

  if (contributes.views !== undefined) {
    const views = object(`${where} views`, contributes.views);
    result.views = {};
    for (const [container, raw] of Object.entries(views)) {
      result.views[container] = list(`${where} views`, raw, container, (item, at) => {
        const view = object(at, item);
        const parsed: ViewContribution = {
          id: text(at, view.id, "id")!,
          name: text(at, view.name, "name")!,
        };
        const when = text(at, view.when, "when", false);
        if (when !== undefined) parsed.when = when;
        if (view.collapsed !== undefined) {
          if (typeof view.collapsed !== "boolean") fail(at, '"collapsed" must be true or false.');
          parsed.collapsed = view.collapsed as boolean;
        }
        if (view.autoHeight !== undefined) {
          if (typeof view.autoHeight !== "boolean") fail(at, '"autoHeight" must be true or false.');
          parsed.autoHeight = view.autoHeight as boolean;
        }
        return parsed;
      });
    }
  }

  // The same command, view or container twice is a mistake that would only show up as a crash later.
  const seen = (what: string, ids: string[]) => {
    const dup = ids.find((id, i) => ids.indexOf(id) !== i);
    if (dup) fail(where, `${what} "${dup}" is declared twice.`);
  };
  seen(
    "command",
    (result.commands ?? []).map((c) => c.command),
  );
  seen(
    "tool",
    (result.tools ?? []).map((t) => t.name),
  );
  seen(
    "editor",
    (result.editors ?? []).map((e) => e.id),
  );
  seen(
    "view container",
    (result.viewsContainers?.activitybar ?? []).map((c) => c.id),
  );
  seen(
    "view",
    Object.values(result.views ?? {})
      .flat()
      .map((v) => v.id),
  );

  manifest.contributes = result;
  return manifest;
}
