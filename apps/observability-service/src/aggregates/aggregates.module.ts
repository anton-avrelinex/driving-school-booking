import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
  DailyAggregate,
  DailyAggregateSchema,
} from "../schemas/daily-aggregate.schema";
import {
  AnalyticsEvent,
  AnalyticsEventSchema,
} from "../schemas/analytics-event.schema";
import { AggregatesController } from "./aggregates.controller";
import { AggregatesService } from "./aggregates.service";
import { RollupService } from "./rollup.service";
import { LogsModule } from "../logs/logs.module";

@Module({
  imports: [
    LogsModule,
    MongooseModule.forFeature([
      { name: DailyAggregate.name, schema: DailyAggregateSchema },
      { name: AnalyticsEvent.name, schema: AnalyticsEventSchema },
    ]),
  ],
  controllers: [AggregatesController],
  providers: [AggregatesService, RollupService],
})
export class AggregatesModule {}
