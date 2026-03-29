import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { BullModule } from "@nestjs/bullmq";
import { REQUEST_LOG_QUEUE } from "@driving-school-booking/shared-types";
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
    BullModule.registerQueue({
      name: REQUEST_LOG_QUEUE,
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
  ],
  controllers: [AppController],
  providers: [AppService, RequestLogInterceptor],
})
export class AppModule {}
