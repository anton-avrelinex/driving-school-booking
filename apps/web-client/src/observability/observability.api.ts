import api from "@/api/api";
import { getCsrfToken } from "@/api/token";
import type {
  IngestLogsBody,
  IngestAnalyticsBody,
} from "@driving-school-booking/shared-types";

export async function sendLogs(body: IngestLogsBody): Promise<void> {
  await api.post("/monitoring/ingest/logs", body);
}

export async function sendAnalytics(body: IngestAnalyticsBody): Promise<void> {
  await api.post("/monitoring/ingest/analytics", body);
}

export function sendBeaconLogs(body: IngestLogsBody): void {
  sendWithKeepalive("/api/monitoring/ingest/logs", body);
}

export function sendBeaconAnalytics(body: IngestAnalyticsBody): void {
  sendWithKeepalive("/api/monitoring/ingest/analytics", body);
}

function sendWithKeepalive(url: string, body: unknown): void {
  const csrf = getCsrfToken();
  if (!csrf) {
    return;
  }

  void fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrf,
    },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {});
}
