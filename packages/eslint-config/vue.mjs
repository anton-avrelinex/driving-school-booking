import { defineConfig } from "eslint/config";
import { createBaseConfig } from "./base.mjs";
import pluginVue from "eslint-plugin-vue";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export function createVueConfig(tsconfigRootDir) {
  return defineConfig(
    createBaseConfig(tsconfigRootDir),
    {
      languageOptions: {
        globals: {
          window: "readonly",
          document: "readonly",
          navigator: "readonly",
          console: "readonly",
        },
      },
    },
    pluginVue.configs["flat/recommended"],
    {
      files: ["**/*.vue"],
      languageOptions: {
        parserOptions: {
          parser: tseslint.parser,
          projectService: true,
          tsconfigRootDir,
          extraFileExtensions: [".vue"],
        },
      },
    },
    {
      rules: {
        "vue/multi-word-component-names": "off",
        "vue/attributes-order": "off",
        "vue/require-default-prop": "off",
      },
    },
    eslintConfigPrettier,
  );
}
