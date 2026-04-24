import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { BullModule } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import {
  OBS_LOGS_QUEUE,
  LOG_TYPES,
  SERVICES,
  type AppLogDto,
} from "@driving-school-booking/shared-types";
import { ObsLoggerModule } from "@driving-school-booking/nestjs-logger";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { RequestLogInterceptor } from "./request-log/request-log.interceptor";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";
import { HealthModule } from "./health/health.module";
import { AuthModule } from "./auth/auth.module";
import { UserModule } from "./user/user.module";
import { StudentModule } from "./student/student.module";
import { InstructorModule } from "./instructor/instructor.module";
import { AdminModule } from "./admin/admin.module";
import { CategoryModule } from "./category/category.module";
import { VehicleModule } from "./vehicle/vehicle.module";
import { CourseModule } from "./course/course.module";
import { LessonModule } from "./lesson/lesson.module";
import { StatsModule } from "./stats/stats.module";

let logQueue: Queue | null = null;
function getLogQueue(): Queue {
  logQueue ??= new Queue(OBS_LOGS_QUEUE, {
    connection: { url: process.env.REDIS_URL },
  });
  return logQueue;
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.getOrThrow<string>("REDIS_URL"),
        },
      }),
    }),
    BullModule.registerQueue({ name: OBS_LOGS_QUEUE }),
    ObsLoggerModule.forRoot({
      serviceName: SERVICES.MAIN,
      logLevel: process.env.LOG_LEVEL ?? "info",
      writeLog: (entry: AppLogDto) => {
        void getLogQueue().add(LOG_TYPES.APP, entry);
      },
    }),
    HealthModule,
    AuthModule,
    UserModule,
    StudentModule,
    InstructorModule,
    AdminModule,
    CategoryModule,
    CourseModule,
    VehicleModule,
    LessonModule,
    StatsModule,
  ],
  controllers: [AppController],
  providers: [AppService, RequestLogInterceptor],
})
export class AppModule {}
