import { LessonStatus } from "../generated/prisma/enums";

export const DEFAULT_LESSON_DURATION_MIN = 120;

// Rejected/Cancelled/Completed do not block new bookings
export const ACTIVE_LESSON_STATUSES: LessonStatus[] = [
  LessonStatus.PENDING,
  LessonStatus.SCHEDULED,
];
