// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import unusedImports from 'eslint-plugin-unused-imports';

// Luật type safety theo .agents/skills/nestjs-type-safety-enforcement.
// Code cũ vi phạm được ghi nhận trong eslint-suppressions.json (chỉ được giảm,
// không được tăng); code mới vi phạm là lỗi.
const typeSafetyRules = {
  // Cấm cast: mọi dạng `as T`, `<T>x`. `as const` vẫn được phép.
  '@typescript-eslint/consistent-type-assertions': [
    'error',
    { assertionStyle: 'never' },
  ],
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/no-non-null-assertion': 'error',
  '@typescript-eslint/no-non-null-asserted-optional-chain': 'error',
  '@typescript-eslint/ban-ts-comment': [
    'error',
    {
      'ts-ignore': true,
      'ts-expect-error': true,
      'ts-nocheck': true,
      'ts-check': false,
    },
  ],
  '@typescript-eslint/switch-exhaustiveness-check': 'error',
  '@typescript-eslint/no-unnecessary-type-assertion': 'error',
  '@typescript-eslint/no-floating-promises': 'error',
  '@typescript-eslint/no-misused-promises': 'error',
  // Nest: module/provider rỗng chỉ hợp lệ khi có decorator
  '@typescript-eslint/no-extraneous-class': [
    'error',
    { allowWithDecorator: true },
  ],
};

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'dist', 'node_modules', 'coverage'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  eslintPluginPrettierRecommended,

  {
    plugins: { 'unused-imports': unusedImports },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: typeSafetyRules,
  },

  // Nơi DUY NHẤT được phép cast trong src/ (phải có @reason + test).
  {
    files: ['src/shared/typing/unsafe.ts'],
    rules: {
      '@typescript-eslint/consistent-type-assertions': 'off',
    },
  },

  // Spec: nới những rule gây ồn do API của Jest — KHÔNG nới cấm cast/`any`.
  {
    files: ['test/**/*.ts', '**/*.spec.ts'],
    rules: {
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      'unused-imports/no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },

  // Helper fake duy nhất cho test (xem .agents/skills/nestjs-type-safety-testing).
  {
    files: ['test/support/typed-fake.ts'],
    rules: {
      '@typescript-eslint/consistent-type-assertions': 'off',
    },
  },
);
