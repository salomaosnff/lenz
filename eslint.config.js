import vueTs from '@salomaosnff/eslint-config/vue/recommended-ts';
import prettier from 'eslint-config-prettier';

export default [
  {
    ignores: [
      '**/node_modules/',
      'packages/ui',
      '.husky',
      '**/dist/',
      'public',
    ],
  },
  ...vueTs,
  // Regras da aplicação
  {
    rules: {
      // TODO: Revisar arquivos que estão usando any
      '@typescript-eslint/no-explicit-any': 'off',
      // Somente para fins de debug
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // Vue.js Não suporta essa regra
      'no-useless-assignment': 'off',
      // Alguns componentes exigem a definição de mais de um componente por arquivo
      'vue/one-component-per-file': 'off',
    },
  },
  // Páginas e layouts da aplicação
  {
    files: [
      'packages/app/src/{pages,layouts}/**/*.vue',
      'extensions/*/src/{pages,layouts}/**/*.vue',
    ],
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },
  // Arquivos de definição de tipos
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-types': 'off',
    },
  },
  // Regras de estilo do Prettier
  prettier,
];