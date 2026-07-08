// @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'
import react from 'eslint-plugin-react'
import reactCompiler from 'eslint-plugin-react-compiler'
import reactHooks from 'eslint-plugin-react-hooks'
import reactDoctor from 'eslint-plugin-react-doctor'
import globals from 'globals'

const reactFiles = ['src/**/*.{jsx,tsx}']

export default [
  ...tanstackConfig,
  {
    rules: {
      'import/no-cycle': 'off',
      'import/order': 'off',
      'sort-imports': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/require-await': 'off',
      'pnpm/json-enforce-catalog': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-void': 'off',
      'prefer-const': 'warn',
    },
  },
  {
    files: ['src/**/*.{js,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
  },
  {
    files: reactFiles,
    ...react.configs.flat.recommended,
    ...react.configs.flat['jsx-runtime'],
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
    },
  },
  {
    files: reactFiles,
    ...reactHooks.configs.flat.recommended,
  },
  {
    files: reactFiles,
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    files: reactFiles,
    ...reactCompiler.configs.recommended,
    rules: {
      'react-compiler/react-compiler': 'warn',
    },
  },
  reactDoctor.configs.recommended,
  reactDoctor.configs['tanstack-start'],
  reactDoctor.configs['tanstack-query'],
  {
    ignores: ['eslint.config.js', 'prettier.config.js', 'vitest.config.ts', 'dist/**', '.output/**'],
  },
]
