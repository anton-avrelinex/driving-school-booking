import type { ZonedDateTime } from "@internationalized/date";
import type {
  AppLogDto,
  LogLevel,
  LogSearchResultDto,
  RequestLogDto,
  Service,
} from "@driving-school-booking/shared-types";
import { parseISOToZoned } from "@/lib/date-utils";

export interface RequestLogModel {
  type: "request";
  service: Service;
  timestamp: ZonedDateTime;
  userId: string | null;
  schoolId: string | null;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
}

export interface AppLogModel {
  type: "app";
  service: Service;
  timestamp: ZonedDateTime;
  userId: string | null;
  schoolId: string | null;
  level: LogLevel;
  message: string;
  context: Record<string, unknown> | null;
  stack: string | null;
}

export type LogItemModel = RequestLogModel | AppLogModel;

export interface LogSearchResultModel {
  items: LogItemModel[];
  total: number;
  page: number;
  limit: number;
}

export function toLogItemModel(
  dto: RequestLogDto | AppLogDto,
): LogItemModel {
  if (dto.type === "request") {
    return {
      type: "request",
      service: dto.service,
      timestamp: parseISOToZoned(dto.timestamp),
      userId: dto.userId,
      schoolId: dto.schoolId,
      method: dto.method,
      path: dto.path,
      statusCode: dto.statusCode,
      durationMs: dto.durationMs,
    };
  }
  return {
    type: "app",
    service: dto.service,
    timestamp: parseISOToZoned(dto.timestamp),
    userId: dto.userId,
    schoolId: dto.schoolId,
    level: dto.level,
    message: dto.message,
    context: dto.context,
    stack: dto.stack,
  };
}

export function toLogSearchResultModel(
  dto: LogSearchResultDto,
): LogSearchResultModel {
  return {
    items: dto.items.map(toLogItemModel),
    total: dto.total,
    page: dto.page,
    limit: dto.limit,
  };
}
