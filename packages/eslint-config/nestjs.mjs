import { defineConfig } from "eslint/config";
import { createBaseConfig } from "./base.mjs";

export function createNestjsConfig(tsconfigRootDir) {
  return defineConfig(createBaseConfig(tsconfigRootDir), {
    ignores: ["src/generated/"],
  });
}
