import api from "@/api/api";
import { getAccessToken } from "@/api/token";
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
  const token = getAccessToken();
  if (!token) return;

  void fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {});
}
