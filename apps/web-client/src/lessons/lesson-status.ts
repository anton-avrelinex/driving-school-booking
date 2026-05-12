import {
  LESSON_STATUSES,
  type LessonStatus,
} from "@driving-school-booking/shared-types";
import type { BadgeVariants } from "@/components/ui/badge";

export function lessonStatusVariant(
  status: LessonStatus,
): BadgeVariants["variant"] {
  switch (status) {
    case LESSON_STATUSES.PENDING:
      return "warning";
    case LESSON_STATUSES.SCHEDULED:
      return "info";
    case LESSON_STATUSES.COMPLETED:
      return "success";
    case LESSON_STATUSES.CANCELLED:
    case LESSON_STATUSES.REJECTED:
      return "destructive";
  }
}
