import { defineConfig } from "eslint/config";
import { createBaseConfig, prettierOverrides } from "./base.mjs";

export function createNestjsConfig(tsconfigRootDir) {
  return defineConfig(
    createBaseConfig(tsconfigRootDir),
    {
      ignores: ["src/generated/"],
    },
    prettierOverrides,
  );
}
