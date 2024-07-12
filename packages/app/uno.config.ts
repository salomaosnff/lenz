import { defineConfig, presetUno, transformerVariantGroup } from 'unocss';

export default defineConfig({
  presets: [presetUno()],
  transformers: [transformerVariantGroup()],
  shortcuts: [
    [
      /^theme--(\w+)$/,
      ([,name]) => `theme--vars--${name} bg--background fg--foreground`,
    ],
  ],
  rules: [
    [
      'theme--vars--dark',
      {
        '--color-background': '#1b1b1b',
        '--color-foreground': '#f0f0f0',
        '--color-primary': '#f0f000',
        '--color-surface': '#2b2b2b',
        '--color-scroll-thumb': '#ffffff7f',
        '--color-success': '#00f000',
        '--color-warning': '#f0f000',
        '--color-error': '#f00000',
      },
    ],
    [
      /^bg--(.+)$/,
      ([,color]) => {
        return { 'background-color': `var(--color-${color})` };
      },
    ],
    [
      /^fg--(.+)$/,
      ([,color]) => {
        return { 'color': `var(--color-${color})` };
      },
    ],
    [
      /^var(?::(\w+))?--(.+)$/,
      ([
        ,name = 'color',
        color,
      ]) => {
        return { [`--current-${name}`]: `var(--color-${color})` };
      },
    ],
    [
      'floating',
      {
        border: '1px solid var(--color-surface)',
        background: 'var(--color-background)',
      },
    ],
  ],
});