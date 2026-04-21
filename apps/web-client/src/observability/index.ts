import type { Router } from "vue-router";
import {
  ANALYTICS_EVENTS,
  LOG_LEVELS,
  LOG_TYPES,
  SERVICES,
  type AppLogDto,
  type AnalyticsEventDto,
} from "@driving-school-booking/shared-types";
import {
  sendLogs,
  sendAnalytics,
  sendBeaconLogs,
  sendBeaconAnalytics,
} from "./observability.api";

const FLUSH_INTERVAL_MS = 30_000;

const logBuffer: Omit<AppLogDto, "userId" | "schoolId">[] = [];
const analyticsBuffer: Omit<AnalyticsEventDto, "userId" | "schoolId">[] = [];
let sessionId: string | null = null;

function bufferLog(
  level: AppLogDto["level"],
  message: string,
  context?: Record<string, unknown>,
  stack?: string,
): void {
  if (import.meta.env.DEV) {
    const fn =
      level === LOG_LEVELS.ERROR
        ? console.error
        : level === LOG_LEVELS.WARN
          ? console.warn
          : console.info;
    fn(message, ...(context ? [context] : []), ...(stack ? [stack] : []));
  }

  logBuffer.push({
    type: LOG_TYPES.APP,
    service: SERVICES.WEB,
    timestamp: new Date().toISOString(),
    level,
    message,
    context: context ?? null,
    stack: stack ?? null,
  });
}

function bufferAnalyticsEvent(
  event: string,
  properties?: Record<string, unknown>,
): void {
  analyticsBuffer.push({
    event,
    service: SERVICES.WEB,
    timestamp: new Date().toISOString(),
    properties: properties ?? null,
    sessionId,
  });
}

async function flush(): Promise<void> {
  const logs = logBuffer.splice(0);
  const events = analyticsBuffer.splice(0);

  const promises: Promise<void>[] = [];
  if (logs.length > 0) promises.push(sendLogs({ logs }));
  if (events.length > 0) promises.push(sendAnalytics({ events }));

  await Promise.allSettled(promises);
}

function flushSync(): void {
  const logs = logBuffer.splice(0);
  const events = analyticsBuffer.splice(0);

  if (logs.length > 0) sendBeaconLogs({ logs });
  if (events.length > 0) sendBeaconAnalytics({ events });
}

export function logError(
  message: string,
  context?: Record<string, unknown>,
  stack?: string,
): void {
  bufferLog(LOG_LEVELS.ERROR, message, context, stack);
}

export function logWarn(
  message: string,
  context?: Record<string, unknown>,
): void {
  bufferLog(LOG_LEVELS.WARN, message, context);
}

export function logInfo(
  message: string,
  context?: Record<string, unknown>,
): void {
  bufferLog(LOG_LEVELS.INFO, message, context);
}

export function trackEvent(
  event: string,
  properties?: Record<string, unknown>,
): void {
  bufferAnalyticsEvent(event, properties);
}

export function initObservability(router: Router): void {
  sessionId = crypto.randomUUID();

  let navigationStartTime: number | null = null;
  let lastRouteEnterTime: number | null = null;
  let lastRoute: string | null = null;

  router.beforeEach((_to, _from, next) => {
    navigationStartTime = performance.now();
    next();
  });

  router.afterEach((to) => {
    const now = performance.now();
    const loadTimeMs =
      navigationStartTime === null
        ? null
        : Math.round(now - navigationStartTime);

    if (lastRoute !== null && lastRouteEnterTime !== null) {
      bufferAnalyticsEvent(ANALYTICS_EVENTS.PAGE_VIEW, {
        route: lastRoute,
        durationMs: Math.round(now - lastRouteEnterTime),
      });
    }

    lastRoute = to.path;
    lastRouteEnterTime = now;

    if (loadTimeMs !== null) {
      bufferAnalyticsEvent(ANALYTICS_EVENTS.PAGE_LOAD, {
        route: to.path,
        loadTimeMs,
      });
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushSync();
    }
  });

  setInterval(async () => flush(), FLUSH_INTERVAL_MS);
}
