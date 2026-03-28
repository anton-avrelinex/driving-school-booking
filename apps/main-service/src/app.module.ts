import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
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
  providers: [AppService],
})
export class AppModule {}
