import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { PipelineStage, QueryFilter } from "mongoose";
import { Model } from "mongoose";
import {
  LOG_TYPES,
  type MonitoringFilters,
  type TimeSeriesFilters,
  type LogSearchFilters,
  type TopEndpointDto,
  type RequestsBySchoolDto,
  type VolumePointDto,
  type ErrorRatePointDto,
  type LatencyPointDto,
  type LogSearchResultDto,
} from "@driving-school-booking/shared-types";
import { Log } from "../schemas/log.schema";

const ISO_DATE_FORMAT = "%Y-%m-%dT%H:%M:%S.000Z";

@Injectable()
export class LogsService {
  constructor(
    @InjectModel(Log.name)
    private readonly logModel: Model<Log>,
  ) {}

  async search(filters: LogSearchFilters): Promise<LogSearchResultDto> {
    const match = this.buildSearchMatch(filters);
    const skip = (filters.page - 1) * filters.limit;

    const [items, countResult] = await Promise.all([
      this.logModel
        .find(match)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(filters.limit)
        .lean(),
      this.logModel.countDocuments(match),
    ]);

    return {
      items: items as unknown as LogSearchResultDto["items"],
      total: countResult,
      page: filters.page,
      limit: filters.limit,
    };
  }

  async getTopEndpoints(
    filters: MonitoringFilters,
    limit?: number,
  ): Promise<TopEndpointDto[]> {
    return this.logModel.aggregate([
      { $match: { ...this.buildMatch(filters), type: LOG_TYPES.REQUEST } },
      {
        $group: {
          _id: { method: "$method", path: "$path" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: limit ?? 10 },
      {
        $project: {
          _id: 0,
          method: "$_id.method",
          path: "$_id.path",
          count: 1,
        },
      },
    ]);
  }

  async getBySchool(
    filters: MonitoringFilters,
  ): Promise<RequestsBySchoolDto[]> {
    return this.logModel.aggregate([
      { $match: { ...this.buildMatch(filters), type: LOG_TYPES.REQUEST } },
      {
        $group: {
          _id: "$schoolId",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      {
        $project: {
          _id: 0,
          schoolId: "$_id",
          count: 1,
        },
      },
    ]);
  }

  async getVolume(filters: TimeSeriesFilters): Promise<VolumePointDto[]> {
    const granularity = filters.granularity ?? "day";

    return this.logModel.aggregate([
      { $match: { ...this.buildMatch(filters), type: LOG_TYPES.REQUEST } },
      {
        $group: {
          _id: {
            $dateTrunc: {
              date: "$timestamp",
              unit: granularity,
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          bucket: {
            $dateToString: { format: ISO_DATE_FORMAT, date: "$_id" },
          },
          count: 1,
        },
      },
    ]);
  }

  async getErrorRate(filters: TimeSeriesFilters): Promise<ErrorRatePointDto[]> {
    const granularity = filters.granularity ?? "day";

    return this.logModel.aggregate([
      { $match: { ...this.buildMatch(filters), type: LOG_TYPES.REQUEST } },
      {
        $group: {
          _id: {
            $dateTrunc: {
              date: "$timestamp",
              unit: granularity,
            },
          },
          total: { $sum: 1 },
          errors: {
            $sum: { $cond: [{ $gte: ["$statusCode", 400] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          bucket: {
            $dateToString: { format: ISO_DATE_FORMAT, date: "$_id" },
          },
          total: 1,
          errors: 1,
          rate: {
            $cond: [
              { $eq: ["$total", 0] },
              0,
              { $round: [{ $divide: ["$errors", "$total"] }, 4] },
            ],
          },
        },
      },
    ]);
  }

  async getLatency(filters: TimeSeriesFilters): Promise<LatencyPointDto[]> {
    const granularity = filters.granularity ?? "day";

    const pipeline: PipelineStage[] = [
      { $match: { ...this.buildMatch(filters), type: LOG_TYPES.REQUEST } },
      {
        $group: {
          _id: {
            $dateTrunc: {
              date: "$timestamp",
              unit: granularity,
            },
          },
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
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          bucket: {
            $dateToString: { format: ISO_DATE_FORMAT, date: "$_id" },
          },
          p50: { $round: [{ $arrayElemAt: ["$p50", 0] }, 1] },
          p95: { $round: [{ $arrayElemAt: ["$p95", 0] }, 1] },
          p99: { $round: [{ $arrayElemAt: ["$p99", 0] }, 1] },
        },
      },
    ];
    return this.logModel.aggregate<LatencyPointDto>(pipeline);
  }

  private buildMatch(
    filters: MonitoringFilters,
  ): PipelineStage.Match["$match"] {
    const match: PipelineStage.Match["$match"] = {
      timestamp: {
        $gte: new Date(filters.from),
        $lte: new Date(filters.to),
      },
    };
    if (filters.schoolId) match.schoolId = filters.schoolId;
    if (filters.userId) match.userId = filters.userId;
    return match;
  }

  private buildSearchMatch(filters: LogSearchFilters): QueryFilter<Log> {
    const match: QueryFilter<Log> = {
      timestamp: {
        $gte: new Date(filters.from),
        $lte: new Date(filters.to),
      },
    };
    if (filters.type) match.type = filters.type;
    if (filters.service) match.service = filters.service;
    if (filters.level) match.level = filters.level;
    if (filters.schoolId) match.schoolId = filters.schoolId;
    if (filters.userId) match.userId = filters.userId;
    if (filters.query) match.$text = { $search: filters.query };
    return match;
  }
}
