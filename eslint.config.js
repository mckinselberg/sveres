// ESLint flat config
import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'legacy/**']
  },
  js.configs.recommended,
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        console: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        // Common browser globals referenced directly
        URL: 'readonly',
        Blob: 'readonly',
        alert: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        performance: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    rules: {
      // React + Hooks best practices
      'react/jsx-uses-react': 'off', // using the new JSX transform
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // General ergonomics
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-constant-condition': ['warn', { checkLoops: false }],
      // Prefer explicit catches but allow empty catch blocks
      'no-empty': ['warn', { allowEmptyCatch: true }],
      // Avoid blocking on env globals we rely on
      'no-undef': 'off',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  // Tests (Vitest)
  {
    files: ['test/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Vitest globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        vi: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-undef': 'off',
    },
  },
];
