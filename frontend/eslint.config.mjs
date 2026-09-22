import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";
import unusedImports from "eslint-plugin-unused-imports";
import importPlugin from "eslint-plugin-import";

const eslintConfig = [
  ...nextVitals,
  ...nextTypescript,
  prettier,
  {
    plugins: {
      "unused-imports": unusedImports,
      import: importPlugin,
    },
    rules: {
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      "import/no-restricted-paths": [
        "warn",
        {
          zones: [
            {
              target: "./src/components/ui",
              from: "./src/features",
              message: "UI components cannot import from features.",
            },
            {
              target: "./src/components/ui",
              from: "./src/components/shared",
              message: "UI components cannot import from shared components.",
            },
            {
              target: "./src/components/shared",
              from: "./src/features",
              message: "Shared components cannot import from features.",
            },
            {
              target: "./src/features/*",
              from: "./src/features/*",
              except: ["./core"], // core/header is allowed if absolutely necessary, but generally try to avoid
              message: "Features cannot import from other features. Use props or move shared logic to core/shared.",
            }
          ]
        }
      ]
    },
  },
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts", "playwright-report/**", "test-results/**", "tests/**"],
  },
];

export default eslintConfig;