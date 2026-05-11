import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export function createBaseConfig(tsconfigRootDir) {
  return defineConfig(
    {
      ignores: ["dist/", "coverage/", "node_modules/"],
    },
    eslint.configs.recommended,
    tseslint.configs.recommendedTypeChecked,
    {
      languageOptions: {
        parserOptions: {
          projectService: true,
          tsconfigRootDir,
        },
      },
    },
    {
      rules: {
        "@typescript-eslint/no-unused-vars": [
          "error",
          { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
        ],
        "@typescript-eslint/no-floating-promises": "error",
        "@typescript-eslint/no-explicit-any": "warn",
        "no-console": "warn",
        eqeqeq: ["error", "always", { null: "ignore" }],
      },
    },
  );
}

// Apply LAST in every preset. Disables formatting rules that conflict with
// prettier, then re-enables the structural rules prettier shouldn't own.
export const prettierOverrides = defineConfig(eslintConfigPrettier, {
  rules: {
    curly: ["error", "all"],
  },
});
