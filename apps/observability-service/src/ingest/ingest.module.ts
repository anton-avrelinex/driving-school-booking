import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
  AnalyticsEvent,
  AnalyticsEventSchema,
} from "../schemas/analytics-event.schema";
import { IngestController } from "./ingest.controller";
import { IngestService } from "./ingest.service";
import { LogsModule } from "../logs/logs.module";

@Module({
  imports: [
    LogsModule,
    MongooseModule.forFeature([
      { name: AnalyticsEvent.name, schema: AnalyticsEventSchema },
    ]),
  ],
  controllers: [IngestController],
  providers: [IngestService],
  exports: [MongooseModule],
})
export class IngestModule {}
