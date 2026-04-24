import type { ZonedDateTime } from "@internationalized/date";
import type {
  LessonDto,
  LessonStatus,
} from "@driving-school-booking/shared-types";
import { parseISOToZoned } from "@/lib/date-utils";

export interface DashboardLesson {
  id: string;
  courseName: string;
  instructorName: string;
  studentName: string;
  startTime: ZonedDateTime;
  endTime: ZonedDateTime;
  status: LessonStatus;
}

export function toDashboardLesson(dto: LessonDto): DashboardLesson {
  return {
    id: dto.id,
    courseName: dto.courseName,
    instructorName: dto.instructorName,
    studentName: dto.studentName,
    startTime: parseISOToZoned(dto.startTime),
    endTime: parseISOToZoned(dto.endTime),
    status: dto.status,
  };
}
