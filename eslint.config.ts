/* eslint-env node */

import { globalIgnores } from 'eslint/config';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';
import standard from '@vue/eslint-config-standard-with-typescript';
import pluginVue from 'eslint-plugin-vue';
import pluginOxlint from 'eslint-plugin-oxlint';
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting';
import autoImport from './.eslintrc-auto-import.json';

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**', '**/public/assets/**', '**/src/types/auto-imports.d.ts', '**/src/types/components.d.ts'],
    languageOptions: {
      // Use the auto-imported globals from .eslintrc-auto-import.json
      globals: autoImport.globals,
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**', '**/public/assets/**', '**/src/types/auto-imports.d.ts', '**/src/types/components.d.ts']),

  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  ...pluginOxlint.configs['flat/recommended'],
  standard,
  {
    name: 'app/allow-any',
    files: ['**/*.{ts,mts,tsx,vue}'],
    rules: {
      'eslint(no-sparse-arrays)': 'off', // This rule is disabled to allow sparse arrays in the code
      '@typescript-eslint/no-unused-vars': 'off', // use no-unused-vars
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  skipFormatting,
);
