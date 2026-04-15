import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { LOG_TYPES } from "@driving-school-booking/shared-types";
import {
  Log,
  LogSchema,
  RequestLogEntrySchema,
  AppLogEntrySchema,
} from "../schemas/log.schema";
import { LogsProcessor } from "./logs.processor";
import { LogsService } from "./logs.service";
import { LogsController } from "./logs.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Log.name,
        schema: LogSchema,
        discriminators: [
          { name: LOG_TYPES.REQUEST, schema: RequestLogEntrySchema },
          { name: LOG_TYPES.APP, schema: AppLogEntrySchema },
        ],
      },
    ]),
  ],
  controllers: [LogsController],
  providers: [LogsProcessor, LogsService],
  exports: [LogsService, MongooseModule],
})
export class LogsModule {}
