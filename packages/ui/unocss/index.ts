import type { Preset } from "unocss";
import type { LuxUiTheme } from "./rules/theme";
import {
  BackgroundRule,
  CurrentColor,
  ForegroundRule,
  ThemesRule,
} from "./rules/theme";

export function presetLuxUi(): Preset<LuxUiTheme> {
  return {
    name: "lux-ui",
    theme: {
      variables: {
        "theme-surface-opacity": "25%",
        "color-surface-primary":
          "oklch(from var(--color-primary) l c h / var(--theme-surface-opacity))",
        "color-surface-danger":
          "oklch(from var(--color-danger) l c h / var(--theme-surface-opacity))",
        "color-surface-warning":
          "oklch(from var(--color-warning) l c h / var(--theme-surface-opacity))",
        "color-surface-info":
          "oklch(from var(--color-info) l c h / var(--theme-surface-opacity))",
        "color-surface-error": "var(--color-surface-danger)",
        "current-color": "var(--color-primary)",
        "current-surface-color":
          "oklch(from var(--current-color) l c h / var(--theme-surface-opacity))",
      },
      themes: {
        light: {
          variables: {},
          colors: {
            primary: "#4A90E2",
            secondary: "#BD10E0",
            background: "#F5F7FA",
            foreground: "#000000",
            surface: "#FFFFFF",
            surface2: "#0000000c",

            danger: "#D0021B",
            warning: "#F8A532",
            info: "#50E3C2",
            success: "#7ED321",
            muted: "#9B9B9B",
          },
        },
        dark: {
          colors: {
            primary: "#4A90E2",
            secondary: "#BD10E0",
            background: "#121212",
            foreground: "#E0E0E0",
            surface: "#1E1E1E",
            surface2: "#ffffff0c",

            danger: "#FF5C5C",
            warning: "#FFA726",
            info: "#4FC3F7",
            success: "#66BB6A",
            muted: "#757575",
          },
        },
      },
    },
    shortcuts: [
      [
        /theme--(.+)/,
        ([, themeName]) =>
          `theme-vars--${themeName} bg--background fg--foreground`,
      ],
      ["flex-center", "flex items-center justify-center"],
    ],
    rules: [
      ...CurrentColor(),
      ThemesRule(),
      ForegroundRule(),
      BackgroundRule(),
    ],
    preflights: [
      {
        getCSS(context) {
          let css = ":root{\n";
          for (const [key, value] of Object.entries(
            context.theme.variables ?? {}
          )) {
            css += `--${key}: ${value};\n`;
          }
          css += "}\n";
          return css;
        },
      },
    ],
  };
}
