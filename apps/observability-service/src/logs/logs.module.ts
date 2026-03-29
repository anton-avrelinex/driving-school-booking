import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { RequestLog, RequestLogSchema } from "./request-log.schema";
import { RequestLogProcessor } from "./request-log.processor";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RequestLog.name, schema: RequestLogSchema },
    ]),
  ],
  providers: [RequestLogProcessor],
})
export class LogsModule {}
