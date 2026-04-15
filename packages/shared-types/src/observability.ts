export const OBS_LOGS_QUEUE = "obs-logs" as const;
export const OBS_ANALYTICS_QUEUE = "obs-analytics" as const;

export const ANALYTICS_EVENTS = {
  PAGE_VIEW: "page_view",
  PAGE_LOAD: "page_load",
} as const;

export type AnalyticsEventName =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export const LOG_TYPES = {
  REQUEST: "request",
  APP: "app",
} as const;

export type LogType = (typeof LOG_TYPES)[keyof typeof LOG_TYPES];

export const LOG_LEVELS = {
  DEBUG: "debug",
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
} as const;

export type LogLevel = (typeof LOG_LEVELS)[keyof typeof LOG_LEVELS];

export const LOG_LEVEL_SEVERITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export const SERVICES = {
  MAIN: "main-service",
  OBS: "observability-service",
  WEB: "web-client",
} as const;

export type Service = (typeof SERVICES)[keyof typeof SERVICES];

export const GRANULARITIES = {
  HOUR: "hour",
  DAY: "day",
  WEEK: "week",
} as const;

export type Granularity = (typeof GRANULARITIES)[keyof typeof GRANULARITIES];

export interface BaseLogDto {
  type: LogType;
  service: Service;
  timestamp: string;
  userId: string | null;
  schoolId: string | null;
}

export interface RequestLogDto extends BaseLogDto {
  type: "request";
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
}

export interface AppLogDto extends BaseLogDto {
  type: "app";
  level: LogLevel;
  message: string;
  context: Record<string, unknown> | null;
  stack: string | null;
}

export interface AnalyticsEventDto {
  event: string;
  service: Service;
  timestamp: string;
  userId: string | null;
  schoolId: string | null;
  properties: Record<string, unknown> | null;
  sessionId: string | null;
}

export interface IngestAppLogItem {
  type: "app";
  service: Service;
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown> | null;
  stack?: string | null;
}

export interface IngestLogsBody {
  logs: IngestAppLogItem[];
}

export interface IngestAnalyticsItem {
  event: string;
  service: Service;
  timestamp: string;
  properties?: Record<string, unknown> | null;
  sessionId?: string | null;
}

export interface IngestAnalyticsBody {
  events: IngestAnalyticsItem[];
}

export interface DailyAggregateMetrics {
  requestCount: number;
  errorCount: number;
  errorRate: number;
  avgDurationMs: number;
  p50DurationMs: number;
  p95DurationMs: number;
  p99DurationMs: number;
  logCountByLevel: Record<LogLevel, number>;
}

export interface TopEndpointAggregate {
  method: string;
  path: string;
  count: number;
  avgDurationMs: number;
}

export interface DailyAggregateDto {
  date: string;
  service: string;
  metrics: DailyAggregateMetrics;
  topEndpoints: TopEndpointAggregate[];
  analyticsEventCounts: Record<string, number>;
}

export interface MonitoringFilters {
  from: string;
  to: string;
  schoolId?: string;
  userId?: string;
}

export interface TopEndpointsFilters extends MonitoringFilters {
  limit?: number;
}

export interface TimeSeriesFilters extends MonitoringFilters {
  granularity?: Granularity;
}

export interface LogSearchFilters extends MonitoringFilters {
  type?: LogType;
  service?: Service;
  level?: LogLevel;
  query?: string;
  page: number;
  limit: number;
}

export interface AnalyticsFilters extends MonitoringFilters {
  event?: string;
  sessionId?: string;
  page: number;
  limit: number;
}

export interface TrendsFilters {
  from: string;
  to: string;
  service?: Service;
}

export interface TopEndpointDto {
  method: string;
  path: string;
  count: number;
}

export interface RequestsBySchoolDto {
  schoolId: string | null;
  count: number;
}

export interface VolumePointDto {
  bucket: string;
  count: number;
}

export interface ErrorRatePointDto {
  bucket: string;
  total: number;
  errors: number;
  rate: number;
}

export interface LatencyPointDto {
  bucket: string;
  p50: number;
  p95: number;
  p99: number;
}

export interface LogSearchResultDto {
  items: (RequestLogDto | AppLogDto)[];
  total: number;
  page: number;
  limit: number;
}

export interface AnalyticsEventResultDto {
  items: AnalyticsEventDto[];
  total: number;
  page: number;
  limit: number;
}

export interface EventCountDto {
  event: string;
  count: number;
}

export interface EventCountTimeSeriesDto {
  bucket: string;
  event: string;
  count: number;
}

export interface PageViewDto {
  route: string;
  count: number;
  avgDurationMs: number;
}

export interface PerformanceDto {
  route: string;
  avg: number;
  p50: number;
  p95: number;
}
