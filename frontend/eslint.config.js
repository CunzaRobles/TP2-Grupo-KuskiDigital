import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    // Pruebas E2E (Cypress + Mocha) y su configuración
    files: ['cypress/**/*.js', 'cypress.config.js'],
    languageOptions: {
      globals: { ...globals.mocha, ...globals.node, cy: 'readonly', Cypress: 'readonly' },
    },
  },
]);
