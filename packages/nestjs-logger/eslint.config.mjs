import { defineConfig } from "eslint/config";
import { createNestjsConfig } from "@driving-school-booking/eslint-config/nestjs";

export default defineConfig(createNestjsConfig(import.meta.dirname), {
  ignores: ["eslint.config.mjs"],
});
