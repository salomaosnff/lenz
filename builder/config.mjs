import { readFile } from "fs/promises";
import yaml from "yaml";
import { ROOT_DIR } from "./const.mjs";
import { join, resolve } from "path";

const file = await readFile(join(ROOT_DIR, "build.yml"), "utf8");
const config = yaml.parse(file);

function normalizeFilterItem(item) {
  if (typeof item === "string") {
    return {
      from: item,
      to: item,
      filter: [],
    };
  }

  const { from, to = from, filter = [] } = item;

  return {
    from,
    to,
    filter: Array.isArray(filter) ? filter : [filter],
  };
}

function normalizeSources(context) {
  return context.map((item) => normalizeFilterItem(item));
}

function normalizeLinuxPlatform(app, platform) {
  if (!platform) {
    return;
  }

  let { arch = "amd64", target = "plain", bin = {}, launchers = [] } = platform;

  arch = [].concat(arch);

  function defaultTarget(target) {
    if (target === "deb") {
      return {
        control: {
          Package: app.id,
          Version: app.version,
          Architecture: arch[0],
          Maintainer: app.author,
          Description: app.description,
          Homepage: app.homepage,
        }
      }
    }
    return {}
  }

  function normalizeTarget(target) {
    if (Array.isArray(target)) {
      return target.reduce((acc, item) => {
        acc[item] = defaultTarget(item);
        return acc;
      }, {});
    }

    if (typeof target === "string") {
      return { [target]: defaultTarget(target) };
    }

    if (typeof target === "object" && target) {
      return Object.entries(target).reduce((acc, [key, value]) => {
        acc[key] = value ?? defaultTarget(target);
        return acc;
      }, {});
    }

    return {};
  }

  return {
    arch,
    target: normalizeTarget(target),
    bin,
    launchers: (Array.isArray(launchers) ? launchers : [launchers]).map(
      (launcher) => {
        const {
          name: Name = app.name,
          exec: Exec = Object.keys(bin)[0],
          icon: Icon,
          categories: Categories = app.categories ?? [],
          type: Type = "Application",
          ...rest
        } = launcher;
        return {
          Name,
          Exec,
          Icon,
          Categories: [].concat(Categories).join(";"),
          Type,
          ...rest,
        }
      }
    ),
  };
}

function normalize(config) {
  const {
    app = {},
    nw = {},
    manifest = require(join(ROOT_DIR, "package.json")),
    platforms = {},
    sources = {},
    hooks = {},
    outDir = "out",
  } = config ?? {};

  return {
    app,
    nw: {
      version: "0.85.0",
      flavor: "normal",
      ...nw,
    },
    manifest: {
      name: app.id,
      version: app.version,
      description: app.description,
      ...manifest,
    },
    hooks,
    platforms: {
      linux: normalizeLinuxPlatform(app, platforms.linux),
    },
    outDir: resolve(ROOT_DIR, outDir),
    sources: normalizeSources(sources),
  };
}

export default normalize(config);
