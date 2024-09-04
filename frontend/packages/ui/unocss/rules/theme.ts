import type { Rule } from 'unocss';

export interface LuxUiTheme {
  variables?: Record<string, string>;
  themes: AppThemeList;
}
export interface AppTheme {
  variables?: Record<string, string>;
  colors?: Record<string, string>;
}

export interface AppThemeList {
  [name: string]: AppTheme;
}

export const ThemesRule: () => Rule<LuxUiTheme> = () => [
  /theme-vars--(.+)/,
  ([, themeName], context) => {
    const theme = context.theme.themes[themeName];

    if (!theme) {
      console.warn(`O Tema ${themeName} não existe`);
      return {};
    }

    const css: Record<string, string> = {};

    for (const [varName, value] of Object.entries(theme.variables ?? {})) {
      css[`--${varName}`] = value;
    }

    for (const [colorName, color] of Object.entries(theme.colors ?? {})) {
      css[`--color-${colorName}`] = color;
      css[`--color-surface-${colorName}`] = `oklch(from var(--color-${colorName}) l c h / var(--theme-surface-opacity))`
    }

    return css;
  },
];

export const CurrentColor: () => Rule<LuxUiTheme>[] = () => [
  ['fg--var', { color: 'var(--current-color)' }],
  ['bg--var', { 'background-color': 'var(--current-color)' }],
  [
    /var--(.+)/,
    ([, colorName]) => {
      return { '--current-color': `var(--color-${colorName})` };
    },
  ],
];

export const ForegroundRule: () => Rule<LuxUiTheme> = () => [
  /fg--(.+)/,
  ([, colorName]) => {
    return { color: `var(--color-${colorName})` };
  },
];

export const BackgroundRule: () => Rule<LuxUiTheme> = () => [
  /bg--(.+)/,
  ([, colorName]) => {
    return { 'background-color': `var(--color-${colorName})` };
  },
];