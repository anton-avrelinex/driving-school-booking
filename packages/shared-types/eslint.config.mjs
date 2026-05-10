import { defineConfig } from "eslint/config";
import {
  createBaseConfig,
  prettierOverrides,
} from "@driving-school-booking/eslint-config/base";

export default defineConfig(
  createBaseConfig(import.meta.dirname),
  prettierOverrides,
  {
    ignores: ["eslint.config.mjs"],
  },
);
