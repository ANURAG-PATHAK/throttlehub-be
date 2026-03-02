import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: './tsconfig.json'
      },
      globals: {
        process: 'readonly',
        console: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint
    },
    rules: {
      'no-undef': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSUnknownKeyword',
          message:
            'Explicit unknown is disallowed in application code. Use precise types or boundary wrappers with narrowing.'
        }
      ]
    }
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'docs/api/openapi.yaml']
  },
  prettier
];
