import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { type FlattenMaps, Model } from "mongoose";
import {
  HEALTH_COMPONENTS,
  HEALTH_STATUSES,
  type HealthComponent,
  type HealthCheckDto,
  type HealthSummaryDto,
  type DayHealthSummaryDto,
  type HealthSummaryFilters,
} from "@driving-school-booking/shared-types";
import { HealthCheck } from "../schemas/health-check.schema";

type HealthCheckDoc = FlattenMaps<HealthCheck>;

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

@Injectable()
export class HealthSummaryService {
  constructor(
    @InjectModel(HealthCheck.name)
    private readonly healthCheckModel: Model<HealthCheck>,
  ) {}

  async getSummaries(
    filters: HealthSummaryFilters,
  ): Promise<DayHealthSummaryDto[]> {
    const checks = await this.healthCheckModel
      .find(this.buildMatch(filters))
      .sort({ timestamp: 1 })
      .lean();

    const grouped = this.groupByDateAndComponent(checks);
    const components = filters.component
      ? [filters.component]
      : Object.values(HEALTH_COMPONENTS);

    const results: DayHealthSummaryDto[] = [];
    for (const [date, dayMap] of grouped) {
      const summaries = this.buildDaySummaries(dayMap, components);
      results.push({ date, summaries });
    }

    results.sort((a, b) => a.date.localeCompare(b.date));
    return results;
  }

  private buildMatch(filters: HealthSummaryFilters): Record<string, unknown> {
    const match: Record<string, unknown> = {
      timestamp: { $gte: new Date(filters.from), $lte: new Date(filters.to) },
    };
    if (filters.component) match.component = filters.component;
    return match;
  }

  private groupByDateAndComponent(
    checks: HealthCheckDoc[],
  ): Map<string, Map<string, HealthCheckDoc[]>> {
    const grouped = new Map<string, Map<string, HealthCheckDoc[]>>();
    for (const check of checks) {
      const date = check.timestamp.toISOString().slice(0, 10);

      if (!grouped.has(date)) grouped.set(date, new Map());
      const dayMap = grouped.get(date)!;

      if (!dayMap.has(check.component)) dayMap.set(check.component, []);
      dayMap.get(check.component)!.push(check);
    }
    return grouped;
  }

  private buildDaySummaries(
    dayMap: Map<string, HealthCheckDoc[]>,
    components: readonly string[],
  ): HealthSummaryDto[] {
    const summaries: HealthSummaryDto[] = [];
    for (const component of components) {
      const dayChecks = dayMap.get(component);
      if (!dayChecks || dayChecks.length === 0) continue;
      summaries.push(this.computeComponentSummary(component, dayChecks));
    }
    return summaries;
  }

  private computeComponentSummary(
    component: string,
    checks: HealthCheckDoc[],
  ): HealthSummaryDto {
    const healthyChecks = checks.filter(
      (c) => c.status === HEALTH_STATUSES.HEALTHY,
    ).length;

    return {
      component: component as HealthComponent,
      totalChecks: checks.length,
      healthyChecks,
      uptimePercent: roundTo((healthyChecks / checks.length) * 100, 2),
      totalDowntimeMinutes: checks.length - healthyChecks,
      incidentCount: this.countIncidents(checks),
    };
  }

  private countIncidents(checks: HealthCheckDoc[]): number {
    let count = checks[0].status === HEALTH_STATUSES.UNHEALTHY ? 1 : 0;
    for (let i = 1; i < checks.length; i++) {
      if (
        checks[i - 1].status === HEALTH_STATUSES.HEALTHY &&
        checks[i].status === HEALTH_STATUSES.UNHEALTHY
      ) {
        count++;
      }
    }
    return count;
  }

  async getChecks(filters: HealthSummaryFilters): Promise<HealthCheckDto[]> {
    const fromDate = new Date(filters.from);
    const toDate = new Date(filters.to);

    const match: Record<string, unknown> = {
      timestamp: { $gte: fromDate, $lte: toDate },
    };
    if (filters.component) match.component = filters.component;

    const checks = await this.healthCheckModel
      .find(match)
      .sort({ timestamp: -1 })
      .limit(1440) // max 1 day of per-minute checks for 6 components
      .lean();

    return checks.map((c) => ({
      component: c.component as HealthComponent,
      timestamp: c.timestamp.toISOString(),
      status: c.status as HealthCheckDto["status"],
      responseTimeMs: c.responseTimeMs,
      error: c.error ?? null,
    }));
  }
}
