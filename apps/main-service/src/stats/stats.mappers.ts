import {
  RECENT_ACTIVITY_TYPES,
  type LessonsOverTimeEntryDto,
  type RecentActivityEntryDto,
} from "@driving-school-booking/shared-types";
import { LessonStatus } from "../generated/prisma/enums";
import { addUtcDays, dayStartUtc, isoDateUtc } from "../common/date-utils";

export function bucketLessonsByDay(
  lessons: { startTime: Date; status: string }[],
  from: Date,
  to: Date,
): LessonsOverTimeEntryDto[] {
  const buckets = new Map<string, LessonsOverTimeEntryDto>();

  let cursor = dayStartUtc(from);
  const boundary = dayStartUtc(to);

  while (cursor <= boundary) {
    const key = isoDateUtc(cursor);
    buckets.set(key, { date: key, scheduled: 0, completed: 0, cancelled: 0 });
    cursor = addUtcDays(cursor, 1);
  }

  for (const lesson of lessons) {
    const key = isoDateUtc(lesson.startTime);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    if (lesson.status === LessonStatus.SCHEDULED) bucket.scheduled++;
    else if (lesson.status === LessonStatus.COMPLETED) bucket.completed++;
    else if (lesson.status === LessonStatus.CANCELLED) bucket.cancelled++;
  }

  return Array.from(buckets.values());
}

export function toRecentActivityEntry(lesson: {
  id: string;
  status: string;
  updatedAt: Date;
  instructor: { user: { firstName: string; lastName: string } };
  enrollment: {
    studentProfile: { user: { firstName: string; lastName: string } };
  };
}): RecentActivityEntryDto {
  const instructor = lesson.instructor.user;
  const student = lesson.enrollment.studentProfile.user;

  return {
    id: lesson.id,
    type: lessonStatusToActivityType(lesson.status),
    timestamp: lesson.updatedAt.toISOString(),
    instructorName: `${instructor.firstName} ${instructor.lastName}`,
    studentName: `${student.firstName} ${student.lastName}`,
  };
}

function lessonStatusToActivityType(
  status: string,
): RecentActivityEntryDto["type"] {
  switch (status) {
    case LessonStatus.COMPLETED:
      return RECENT_ACTIVITY_TYPES.COMPLETED;
    case LessonStatus.CANCELLED:
      return RECENT_ACTIVITY_TYPES.CANCELLED;
    default:
      return RECENT_ACTIVITY_TYPES.BOOKED;
  }
}
