import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { HealthModule } from "./health/health.module";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { BullModule } from "@nestjs/bullmq";
import { LogsModule } from "./logs/logs.module";
import { REQUEST_LOG_QUEUE } from "@driving-school-booking/shared-types";

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
      name: REQUEST_LOG_QUEUE,
    }),
    HealthModule,
    LogsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
