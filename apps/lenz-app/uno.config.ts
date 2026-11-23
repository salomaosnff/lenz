import { defineConfig, presetWind4, transformerDirectives, transformerVariantGroup } from "unocss";

/**
 * Semantic color tokens. Values live in CSS variables (see `preflights`) so a
 * theme can be swapped at runtime by overriding them, e.g. `[data-theme="light"]`.
 * Usage: `bg-primary text-primary-foreground hover:bg-primary-hover`.
 */
const semantic = ["primary", "secondary", "success", "info", "warning", "danger"] as const;

const colors = {
  ...Object.fromEntries(
    semantic.map((name) => [
      name,
      {
        DEFAULT: `var(--color-${name})`,
        hover: `var(--color-${name}-hover)`,
        foreground: `var(--color-${name}-foreground)`,
      },
    ]),
  ),
  background: "var(--color-background)",
  foreground: "var(--color-foreground)",
  muted: { DEFAULT: "var(--color-muted)", foreground: "var(--color-muted-foreground)" },
  surface: { DEFAULT: "var(--color-surface)", raised: "var(--color-surface-raised)" },
  border: "var(--color-border)",
  hover: "var(--color-hover)",
  ring: "var(--color-ring)",
};

// Dark theme (default, VSCode Dark+ inspired).
const dark = {
  primary: ["#8b5cf6", "#7c3aed", "#ffffff"],
  secondary: ["#3a3d41", "#45494e", "#cccccc"],
  success: ["#3fb950", "#2ea043", "#ffffff"],
  info: ["#3794ff", "#2b7bd6", "#ffffff"],
  warning: ["#cca700", "#b89500", "#1e1e1e"],
  danger: ["#f14c4c", "#d13b3b", "#ffffff"],
} as const;

const vars = (entries: Record<string, readonly [string, string, string]>) =>
  Object.entries(entries)
    .map(
      ([name, [base, hover, fg]]) =>
        `--color-${name}:${base};--color-${name}-hover:${hover};--color-${name}-foreground:${fg};`,
    )
    .join("");

export default defineConfig({
  presets: [presetWind4()],
  transformers: [transformerVariantGroup(), transformerDirectives()],
  theme: { colors },
  preflights: [
    {
      getCSS: () => `:root{${vars(dark)}
--color-background:#121314;--color-foreground:#bfbfbf;
--color-muted:#2a2d2e;--color-muted-foreground:#8b8b8b;
--color-surface:#191a1b;--color-surface-raised:#202122;
--color-border:#2a2b2c;--color-hover:#ffffff0f;--color-ring:var(--color-primary);}`,
    },
  ],
});
