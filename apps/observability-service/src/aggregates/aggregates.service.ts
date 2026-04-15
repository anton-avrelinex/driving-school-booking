import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import type {
  TrendsFilters,
  DailyAggregateDto,
} from "@driving-school-booking/shared-types";
import { DailyAggregate } from "../schemas/daily-aggregate.schema";

@Injectable()
export class AggregatesService {
  constructor(
    @InjectModel(DailyAggregate.name)
    private readonly aggregateModel: Model<DailyAggregate>,
  ) {}

  async getTrends(filters: TrendsFilters): Promise<DailyAggregateDto[]> {
    const match: Record<string, unknown> = {
      date: {
        $gte: filters.from.slice(0, 10),
        $lte: filters.to.slice(0, 10),
      },
    };
    if (filters.service) match.service = filters.service;

    return (await this.aggregateModel
      .find(match)
      .sort({ date: -1 })
      .lean()) as unknown as DailyAggregateDto[];
  }
}
