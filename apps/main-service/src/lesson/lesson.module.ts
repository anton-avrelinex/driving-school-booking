import { Module } from "@nestjs/common";
import { LessonAvailabilityService } from "./lesson-availability.service";
import { LessonLifecycleService } from "./lesson-lifecycle.service";
import { LessonController } from "./lesson.controller";

@Module({
  controllers: [LessonController],
  providers: [LessonAvailabilityService, LessonLifecycleService],
})
export class LessonModule {}
