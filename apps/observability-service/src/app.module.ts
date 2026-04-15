import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { HealthModule } from "./health/health.module";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { BullModule } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { ScheduleModule } from "@nestjs/schedule";
import { JwtAuthModule } from "@driving-school-booking/nestjs-auth";
import { ObsLoggerModule } from "@driving-school-booking/nestjs-logger";
import {
  SERVICES,
  LOG_TYPES,
  OBS_LOGS_QUEUE,
  type AppLogDto,
} from "@driving-school-booking/shared-types";
import { LogsModule } from "./logs/logs.module";
import { IngestModule } from "./ingest/ingest.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { AggregatesModule } from "./aggregates/aggregates.module";

let logQueue: Queue | null = null;
function getLogQueue(): Queue {
  logQueue ??= new Queue(OBS_LOGS_QUEUE, {
    connection: { url: process.env.REDIS_URL },
  });
  return logQueue;
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>("MONGODB_URI"),
      }),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.getOrThrow<string>("REDIS_URL"),
        },
      }),
    }),
    BullModule.registerQueue({
      name: OBS_LOGS_QUEUE,
    }),
    ScheduleModule.forRoot(),
    JwtAuthModule,
    ObsLoggerModule.forRoot({
      serviceName: SERVICES.OBS,
      logLevel: process.env.LOG_LEVEL ?? "info",
      writeLog: (entry: AppLogDto) => {
        void getLogQueue().add(LOG_TYPES.APP, entry);
      },
    }),
    HealthModule,
    LogsModule,
    IngestModule,
    AnalyticsModule,
    AggregatesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
