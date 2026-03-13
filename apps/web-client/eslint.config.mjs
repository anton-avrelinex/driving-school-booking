import { defineConfig } from "eslint/config";
import { createVueConfig } from "@driving-school-booking/eslint-config/vue";

export default defineConfig(createVueConfig(import.meta.dirname), {
  ignores: ["eslint.config.mjs"],
});
