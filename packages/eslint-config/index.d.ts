import type { Linter } from "eslint";

declare module "@driving-school-booking/eslint-config/base" {
  export function createBaseConfig(tsconfigRootDir: string): Linter.Config[];
}

declare module "@driving-school-booking/eslint-config/nestjs" {
  export function createNestjsConfig(tsconfigRootDir: string): Linter.Config[];
}

declare module "@driving-school-booking/eslint-config/vue" {
  export function createVueConfig(tsconfigRootDir: string): Linter.Config[];
}
