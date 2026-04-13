import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { PipelineStage } from "mongoose";
import { Model } from "mongoose";
import type {
  MonitoringFilters,
  TimeSeriesFilters,
  TopEndpointDto,
  RequestsBySchoolDto,
  VolumePointDto,
  ErrorRatePointDto,
  LatencyPointDto,
} from "@driving-school-booking/shared-types";
import { RequestLog } from "./request-log.schema";

const ISO_DATE_FORMAT = "%Y-%m-%dT%H:%M:%S.000Z";

@Injectable()
export class LogsService {
  constructor(
    @InjectModel(RequestLog.name)
    private readonly requestLogModel: Model<RequestLog>,
  ) {}

  async getTopEndpoints(
    filters: MonitoringFilters,
    limit?: number,
  ): Promise<TopEndpointDto[]> {
    return this.requestLogModel.aggregate([
      { $match: this.buildMatch(filters) },
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
    return this.requestLogModel.aggregate([
      { $match: this.buildMatch(filters) },
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

    return this.requestLogModel.aggregate([
      { $match: this.buildMatch(filters) },
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

    return this.requestLogModel.aggregate([
      { $match: this.buildMatch(filters) },
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
      { $match: this.buildMatch(filters) },
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
    return this.requestLogModel.aggregate<LatencyPointDto>(pipeline);
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

    if (filters.schoolId) {
      match.schoolId = filters.schoolId;
    }

    if (filters.userId) {
      match.userId = filters.userId;
    }

    return match;
  }
}
