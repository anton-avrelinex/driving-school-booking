import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { RequestLog, RequestLogSchema } from "./request-log.schema";
import { RequestLogProcessor } from "./request-log.processor";
import { LogsService } from "./logs.service";
import { LogsController } from "./logs.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RequestLog.name, schema: RequestLogSchema },
    ]),
  ],
  controllers: [LogsController],
  providers: [RequestLogProcessor, LogsService],
  exports: [LogsService],
})
export class LogsModule {}
