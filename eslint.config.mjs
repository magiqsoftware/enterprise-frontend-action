// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: ['dist/', 'node_modules/', '**/*.d.ts'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  prettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
);
