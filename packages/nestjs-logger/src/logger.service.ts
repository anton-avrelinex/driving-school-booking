import { Inject, Injectable } from "@nestjs/common";
import {
  LOG_LEVEL_SEVERITY,
  LOG_TYPES,
  type AppLogDto,
  type LogLevel,
  type Service,
} from "@driving-school-booking/shared-types";
import { LOGGER_OPTIONS, type LoggerModuleOptions } from "./logger.interfaces";
import { RequestContextStore } from "./request-context.interceptor";

@Injectable()
export class ObsLoggerService {
  private readonly minSeverity: number;
  private readonly serviceName: Service;
  private readonly writeLog: (entry: AppLogDto) => void;

  constructor(@Inject(LOGGER_OPTIONS) options: LoggerModuleOptions) {
    this.serviceName = options.serviceName;
    this.writeLog = options.writeLog;
    this.minSeverity =
      LOG_LEVEL_SEVERITY[(options.logLevel ?? "info") as LogLevel] ?? 1;
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log("debug", message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log("info", message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log("warn", message, context);
  }

  error(
    message: string,
    context?: Record<string, unknown>,
    stack?: string,
  ): void {
    this.log("error", message, context, stack);
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    stack?: string,
  ): void {
    if (LOG_LEVEL_SEVERITY[level] < this.minSeverity) return;

    const reqCtx = RequestContextStore.getStore();

    const entry: AppLogDto = {
      type: LOG_TYPES.APP as "app",
      service: this.serviceName,
      timestamp: new Date().toISOString(),
      userId: reqCtx?.userId ?? null,
      schoolId: reqCtx?.schoolId ?? null,
      level,
      message,
      context: context ?? null,
      stack: stack ?? null,
    };

    this.writeLog(entry);
  }
}
