import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectModel } from "@nestjs/mongoose";
import { Model, type PipelineStage } from "mongoose";
import {
  LOG_TYPES,
  SERVICES,
  HEALTH_COMPONENTS,
  HEALTH_STATUSES,
  type DailyAggregateMetrics,
  type TopEndpointAggregate,
  type HealthSummaryDto,
} from "@driving-school-booking/shared-types";
import { Log } from "../schemas/log.schema";
import { AnalyticsEvent } from "../schemas/analytics-event.schema";
import { DailyAggregate } from "../schemas/daily-aggregate.schema";
import { HealthCheck } from "../schemas/health-check.schema";
import {
  addUtcDays,
  dayEndUtc,
  dayStartUtc,
  isoDateUtc,
} from "../common/date-utils";

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

@Injectable()
export class RollupService {
  private readonly logger = new Logger(RollupService.name);

  constructor(
    @InjectModel(Log.name)
    private readonly logModel: Model<Log>,
    @InjectModel(AnalyticsEvent.name)
    private readonly analyticsModel: Model<AnalyticsEvent>,
    @InjectModel(DailyAggregate.name)
    private readonly aggregateModel: Model<DailyAggregate>,
    @InjectModel(HealthCheck.name)
    private readonly healthCheckModel: Model<HealthCheck>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleDailyRollup(): Promise<void> {
    const yesterday = addUtcDays(new Date(), -1);
    const dateStr = isoDateUtc(yesterday);

    this.logger.log(`Starting daily rollup for ${dateStr}`);

    for (const service of Object.values(SERVICES)) {
      try {
        await this.rollupForServiceAndDate(service, yesterday);
      } catch (err) {
        this.logger.error(`Rollup failed for ${service} on ${dateStr}`, err);
      }
    }
  }

  async rollupForServiceAndDate(service: string, day: Date): Promise<void> {
    const dayStart = dayStartUtc(day);
    const dayEnd = dayEndUtc(day);
    const dateStr = isoDateUtc(day);
    const timeMatch = {
      timestamp: { $gte: dayStart, $lte: dayEnd },
      service,
    };

    const [metrics, topEndpoints, analyticsEventCounts, healthSummary] =
      await Promise.all([
        this.computeMetrics(timeMatch),
        this.computeTopEndpoints(timeMatch),
        this.computeAnalyticsEventCounts(dayStart, dayEnd),
        this.computeHealthSummary(dayStart, dayEnd),
      ]);

    await this.aggregateModel.findOneAndUpdate(
      { date: dateStr, service },
      {
        date: dateStr,
        service,
        metrics,
        topEndpoints,
        analyticsEventCounts,
        healthSummary,
      },
      { upsert: true },
    );
  }

  private async computeMetrics(
    match: Record<string, unknown>,
  ): Promise<DailyAggregateMetrics> {
    const requestMatch = { ...match, type: LOG_TYPES.REQUEST };
    const appMatch = { ...match, type: LOG_TYPES.APP };

    const [requestStats, logCounts] = await Promise.all([
      this.logModel.aggregate<{
        requestCount: number;
        errorCount: number;
        avgDurationMs: number;
        p50: number[];
        p95: number[];
        p99: number[];
      }>([
        { $match: requestMatch },
        {
          $group: {
            _id: null,
            requestCount: { $sum: 1 },
            errorCount: {
              $sum: { $cond: [{ $gte: ["$statusCode", 400] }, 1, 0] },
            },
            avgDurationMs: { $avg: "$durationMs" },
            p50: {
              $percentile: {
                input: "$durationMs",
                p: [0.5],
                method: "approximate",
              },
            },
            p95: {
              $percentile: {
                input: "$durationMs",
                p: [0.95],
                method: "approximate",
              },
            },
            p99: {
              $percentile: {
                input: "$durationMs",
                p: [0.99],
                method: "approximate",
              },
            },
          } as PipelineStage.Group["$group"],
        },
      ]),
      this.logModel.aggregate<{ _id: string; count: number }>([
        { $match: appMatch },
        { $group: { _id: "$level", count: { $sum: 1 } } },
      ]),
    ]);

    const stats = requestStats[0];
    const logCountByLevel = { debug: 0, info: 0, warn: 0, error: 0 };
    for (const lc of logCounts) {
      if (lc._id in logCountByLevel) {
        logCountByLevel[lc._id as keyof typeof logCountByLevel] = lc.count;
      }
    }

    return {
      requestCount: stats?.requestCount ?? 0,
      errorCount: stats?.errorCount ?? 0,
      errorRate:
        stats && stats.requestCount > 0
          ? roundTo(stats.errorCount / stats.requestCount, 4)
          : 0,
      avgDurationMs: roundTo(stats?.avgDurationMs ?? 0, 1),
      p50DurationMs: roundTo(stats?.p50?.[0] ?? 0, 1),
      p95DurationMs: roundTo(stats?.p95?.[0] ?? 0, 1),
      p99DurationMs: roundTo(stats?.p99?.[0] ?? 0, 1),
      logCountByLevel,
    };
  }

  private async computeTopEndpoints(
    match: Record<string, unknown>,
  ): Promise<TopEndpointAggregate[]> {
    return this.logModel.aggregate([
      { $match: { ...match, type: LOG_TYPES.REQUEST } },
      {
        $group: {
          _id: { method: "$method", path: "$path" },
          count: { $sum: 1 },
          avgDurationMs: { $avg: "$durationMs" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          method: "$_id.method",
          path: "$_id.path",
          count: 1,
          avgDurationMs: { $round: ["$avgDurationMs", 1] },
        },
      },
    ]);
  }

  private async computeAnalyticsEventCounts(
    dayStart: Date,
    dayEnd: Date,
  ): Promise<Record<string, number>> {
    const counts = await this.analyticsModel.aggregate<{
      event: string;
      count: number;
    }>([
      {
        $match: {
          timestamp: { $gte: dayStart, $lte: dayEnd },
        },
      },
      { $group: { _id: "$event", count: { $sum: 1 } } },
      { $project: { _id: 0, event: "$_id", count: 1 } },
    ]);

    return Object.fromEntries(counts.map((c) => [c.event, c.count]));
  }

  private async computeHealthSummary(
    dayStart: Date,
    dayEnd: Date,
  ): Promise<HealthSummaryDto[]> {
    const components = Object.values(HEALTH_COMPONENTS);
    const summaries: HealthSummaryDto[] = [];

    for (const component of components) {
      const checks = await this.healthCheckModel
        .find({
          component,
          timestamp: { $gte: dayStart, $lte: dayEnd },
        })
        .sort({ timestamp: 1 })
        .lean();

      if (checks.length === 0) continue;

      const healthyChecks = checks.filter(
        (c) => c.status === HEALTH_STATUSES.HEALTHY,
      ).length;
      const unhealthyChecks = checks.length - healthyChecks;

      let incidentCount = 0;
      for (let i = 1; i < checks.length; i++) {
        if (
          checks[i - 1].status === HEALTH_STATUSES.HEALTHY &&
          checks[i].status === HEALTH_STATUSES.UNHEALTHY
        ) {
          incidentCount++;
        }
      }
      if (checks[0].status === HEALTH_STATUSES.UNHEALTHY) {
        incidentCount++;
      }

      summaries.push({
        component: component,
        totalChecks: checks.length,
        healthyChecks,
        uptimePercent: roundTo((healthyChecks / checks.length) * 100, 2),
        totalDowntimeMinutes: unhealthyChecks,
        incidentCount,
      });
    }

    return summaries;
  }
}
