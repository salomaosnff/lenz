import {
  defineConfig,
  presetIcons,
  presetTypography,
  presetUno,
  presetWebFonts,
  transformerDirectives,
  transformerVariantGroup,
} from "unocss";
import { presetLuxUi } from "./unocss";

export default defineConfig({
  shortcuts: [["link", "fg--primary hover:underline cursor-pointer"]],
  theme: {
    fontSize: {
      xs: "0.375rem",
      dynamic: "clamp(12px, calc(0.6875rem + ((1vw - 7.68px) * 0.1736)), 14px)",
    },
  },
  presets: [
    presetUno(),
    presetLuxUi(),
    presetIcons({
      scale: 1.2,
      warn: true,
    }),
    presetTypography({ selectorName: "typo" }),
    presetWebFonts({
      fonts: {
        mono: [
          'Menlo',
          'Consolas',
          'Bitstream Vera Sans Mono',
          'monospace',
          'Apple Color Emoji',
          'Segoe UI Emoji'
        ],
        sans: [
          // "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Open Sans",
          // "system-ui",
          // "sans-serif",
          // "Apple Color Emoji",
          "Segoe UI Emoji",
        ],
      },
    }),
  ],
  transformers: [transformerDirectives(), transformerVariantGroup()],
  safelist: "theme--dark theme--light".split(" "),
});
