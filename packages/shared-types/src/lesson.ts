import type { LessonStatus } from "./constants";

export interface LessonDto {
  id: string;
  enrollmentId: string;
  courseName: string;
  instructorName: string;
  instructorNumber: string | null;
  studentName: string;
  vehicleId: string | null;
  vehicleName: string | null;
  startTime: string;
  endTime: string;
  status: LessonStatus;
  cancelledAt: string | null;
  completedAt: string | null;
  confirmedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
}

export interface CancellationInfoDto {
  deadlineAt: string | null;
  fee: number;
}

export interface CreateLessonDto {
  enrollmentId: string;
  instructorId: string;
  startTime: string;
}

export interface AvailableSlotDto {
  startTime: string;
  endTime: string;
  instructorIds: string[];
}

export interface AvailableInstructorDto {
  id: string;
  firstName: string;
  lastName: string;
  instructorNumber: string | null;
}

export interface AvailabilityRangeQueryDto {
  enrollmentId: string;
  from: string;
  to: string;
  instructorId?: string;
}

export interface AssignVehicleDto {
  vehicleId: string;
}
