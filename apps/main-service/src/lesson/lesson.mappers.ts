import type { LessonDto } from "@driving-school-booking/shared-types";

export function toLessonDto(lesson: {
  id: string;
  enrollmentId: string;
  enrollment: {
    course: { name: string };
    studentProfile: {
      user: { firstName: string; lastName: string };
    };
  };
  instructor: {
    instructorNumber: string | null;
    user: { firstName: string; lastName: string };
  };
  vehicleId: string | null;
  vehicle: {
    make: string;
    model: string;
    licensePlate: string;
  } | null;
  startTime: Date;
  endTime: Date;
  status: string;
  cancelledAt: Date | null;
  completedAt: Date | null;
  confirmedAt: Date | null;
  rejectedAt: Date | null;
  createdAt: Date;
}): LessonDto {
  const student = lesson.enrollment.studentProfile.user;
  const instructor = lesson.instructor.user;

  return {
    id: lesson.id,
    enrollmentId: lesson.enrollmentId,
    courseName: lesson.enrollment.course.name,
    instructorName: `${instructor.firstName} ${instructor.lastName}`,
    instructorNumber: lesson.instructor.instructorNumber,
    studentName: `${student.firstName} ${student.lastName}`,
    vehicleId: lesson.vehicleId,
    vehicleName: lesson.vehicle
      ? `${lesson.vehicle.make} ${lesson.vehicle.model} (${lesson.vehicle.licensePlate})`
      : null,
    startTime: lesson.startTime.toISOString(),
    endTime: lesson.endTime.toISOString(),
    status: lesson.status as LessonDto["status"],
    cancelledAt: lesson.cancelledAt?.toISOString() ?? null,
    completedAt: lesson.completedAt?.toISOString() ?? null,
    confirmedAt: lesson.confirmedAt?.toISOString() ?? null,
    rejectedAt: lesson.rejectedAt?.toISOString() ?? null,
    createdAt: lesson.createdAt.toISOString(),
  };
}
