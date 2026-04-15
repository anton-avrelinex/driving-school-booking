import type { Service, AppLogDto } from "@driving-school-booking/shared-types";

export interface LoggerModuleOptions {
  serviceName: Service;
  logLevel?: string;
  writeLog: (entry: AppLogDto) => void;
}

export const LOGGER_OPTIONS = Symbol("LOGGER_OPTIONS");
