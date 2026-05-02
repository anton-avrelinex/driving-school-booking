import type { ZonedDateTime } from "@internationalized/date";
import type {
  AvailableSlotDto,
  LessonDto,
  LessonStatus,
} from "@driving-school-booking/shared-types";
import { parseISOToZoned } from "@/lib/date-utils";

export interface LessonModel {
  id: string;
  enrollmentId: string;
  courseName: string;
  instructorName: string;
  studentName: string;
  vehicleId: string | null;
  vehicleName: string | null;
  startTime: ZonedDateTime;
  endTime: ZonedDateTime;
  status: LessonStatus;
  cancelledAt: ZonedDateTime | null;
  completedAt: ZonedDateTime | null;
  createdAt: ZonedDateTime;
}

export interface SlotModel {
  startTime: ZonedDateTime;
  endTime: ZonedDateTime;
  instructorIds: string[];
}

export function toLessonModel(dto: LessonDto): LessonModel {
  return {
    id: dto.id,
    enrollmentId: dto.enrollmentId,
    courseName: dto.courseName,
    instructorName: dto.instructorName,
    studentName: dto.studentName,
    vehicleId: dto.vehicleId,
    vehicleName: dto.vehicleName,
    status: dto.status,
    startTime: parseISOToZoned(dto.startTime),
    endTime: parseISOToZoned(dto.endTime),
    cancelledAt: dto.cancelledAt ? parseISOToZoned(dto.cancelledAt) : null,
    completedAt: dto.completedAt ? parseISOToZoned(dto.completedAt) : null,
    createdAt: parseISOToZoned(dto.createdAt),
  };
}

export function toSlotModel(dto: AvailableSlotDto): SlotModel {
  return {
    startTime: parseISOToZoned(dto.startTime),
    endTime: parseISOToZoned(dto.endTime),
    instructorIds: dto.instructorIds,
  };
}
