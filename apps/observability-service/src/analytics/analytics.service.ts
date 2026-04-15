import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, type PipelineStage } from "mongoose";
import {
  ANALYTICS_EVENTS,
  type AnalyticsFilters,
  type TimeSeriesFilters,
  type AnalyticsEventResultDto,
  type EventCountDto,
  type PageViewDto,
  type PerformanceDto,
} from "@driving-school-booking/shared-types";
import { AnalyticsEvent } from "../schemas/analytics-event.schema";

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(AnalyticsEvent.name)
    private readonly analyticsModel: Model<AnalyticsEvent>,
  ) {}

  async getEvents(filters: AnalyticsFilters): Promise<AnalyticsEventResultDto> {
    const match = this.buildMatch(filters);
    const skip = (filters.page - 1) * filters.limit;

    const [items, total] = await Promise.all([
      this.analyticsModel
        .find(match)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(filters.limit)
        .lean(),
      this.analyticsModel.countDocuments(match),
    ]);

    return {
      items: items as unknown as AnalyticsEventResultDto["items"],
      total,
      page: filters.page,
      limit: filters.limit,
    };
  }

  async getEventCounts(filters: TimeSeriesFilters): Promise<EventCountDto[]> {
    const match = this.buildTimeMatch(filters);

    return this.analyticsModel.aggregate([
      { $match: match },
      { $group: { _id: "$event", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { _id: 0, event: "$_id", count: 1 } },
    ]);
  }

  async getPageViews(filters: TimeSeriesFilters): Promise<PageViewDto[]> {
    const match = {
      ...this.buildTimeMatch(filters),
      event: ANALYTICS_EVENTS.PAGE_VIEW,
    };

    return this.analyticsModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$properties.route",
          count: { $sum: 1 },
          avgDurationMs: { $avg: "$properties.durationMs" },
        },
      },
      { $sort: { count: -1 } },
      {
        $project: {
          _id: 0,
          route: "$_id",
          count: 1,
          avgDurationMs: { $round: ["$avgDurationMs", 1] },
        },
      },
    ]);
  }

  async getPerformance(filters: TimeSeriesFilters): Promise<PerformanceDto[]> {
    const match = {
      ...this.buildTimeMatch(filters),
      event: ANALYTICS_EVENTS.PAGE_LOAD,
    };

    const pipeline: PipelineStage[] = [
      { $match: match },
      {
        $group: {
          _id: "$properties.route",
          avg: { $avg: "$properties.loadTimeMs" },
          p50: {
            $percentile: {
              input: "$properties.loadTimeMs",
              p: [0.5],
              method: "approximate",
            },
          },
          p95: {
            $percentile: {
              input: "$properties.loadTimeMs",
              p: [0.95],
              method: "approximate",
            },
          },
        } as PipelineStage.Group["$group"],
      },
      { $sort: { avg: -1 } },
      {
        $project: {
          _id: 0,
          route: "$_id",
          avg: { $round: ["$avg", 1] },
          p50: { $round: [{ $arrayElemAt: ["$p50", 0] }, 1] },
          p95: { $round: [{ $arrayElemAt: ["$p95", 0] }, 1] },
        },
      },
    ];

    return this.analyticsModel.aggregate<PerformanceDto>(pipeline);
  }

  private buildMatch(filters: AnalyticsFilters) {
    const match: Record<string, unknown> = {
      timestamp: {
        $gte: new Date(filters.from),
        $lte: new Date(filters.to),
      },
    };
    if (filters.event) match.event = filters.event;
    if (filters.sessionId) match.sessionId = filters.sessionId;
    if (filters.schoolId) match.schoolId = filters.schoolId;
    if (filters.userId) match.userId = filters.userId;
    return match;
  }

  private buildTimeMatch(filters: TimeSeriesFilters) {
    const match: Record<string, unknown> = {
      timestamp: {
        $gte: new Date(filters.from),
        $lte: new Date(filters.to),
      },
    };
    if (filters.schoolId) match.schoolId = filters.schoolId;
    if (filters.userId) match.userId = filters.userId;
    return match;
  }
}
