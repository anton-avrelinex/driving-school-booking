import type { LessonStatus } from "./constants";

export interface LessonDto {
  id: string;
  enrollmentId: string;
  courseName: string;
  instructorName: string;
  studentName: string;
  vehicleId: string | null;
  vehicleName: string | null;
  startTime: string;
  endTime: string;
  status: LessonStatus;
  cancelledAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface CreateLessonDto {
  enrollmentId: string;
  instructorId: string;
  startTime: string;
}

export interface AvailableSlotDto {
  startTime: string;
  endTime: string;
}

export interface AvailableInstructorDto {
  id: string;
  firstName: string;
  lastName: string;
}

export interface AssignVehicleDto {
  vehicleId: string;
}
