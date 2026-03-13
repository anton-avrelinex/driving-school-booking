import { defineConfig } from "eslint/config";
import { createBaseConfig } from "./base.mjs";
import pluginVue from "eslint-plugin-vue";
import tseslint from "typescript-eslint";

export function createVueConfig(tsconfigRootDir) {
  return defineConfig(
    createBaseConfig(tsconfigRootDir),
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
        "vue/max-attributes-per-line": "off",
        "vue/singleline-html-element-content-newline": "off",
        "vue/html-self-closing": "off",
        "vue/html-closing-bracket-newline": "off",
        "vue/html-indent": "off",
        "vue/attribute-order": "off",
      },
    },
  );
}
