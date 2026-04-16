import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import type {
  DailyAggregateMetrics,
  HealthSummaryDto,
  TopEndpointAggregate,
} from "@driving-school-booking/shared-types";

export type DailyAggregateDocument = HydratedDocument<DailyAggregate>;

@Schema({ collection: "daily_aggregates", timestamps: false })
export class DailyAggregate {
  @Prop({ required: true })
  date!: string;

  @Prop({ required: true })
  service!: string;

  @Prop({ type: Object, required: true })
  metrics!: DailyAggregateMetrics;

  @Prop({ type: [Object], default: [] })
  topEndpoints!: TopEndpointAggregate[];

  @Prop({ type: Object, default: {} })
  analyticsEventCounts!: Record<string, number>;

  @Prop({ type: [Object], default: [] })
  healthSummary!: HealthSummaryDto[];
}

export const DailyAggregateSchema =
  SchemaFactory.createForClass(DailyAggregate);

DailyAggregateSchema.index({ date: -1, service: 1 }, { unique: true });
