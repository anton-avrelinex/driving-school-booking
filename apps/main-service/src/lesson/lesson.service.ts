import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  AvailableInstructorDto,
  AvailableSlotDto,
  LessonDto,
} from "@driving-school-booking/shared-types";
import { LessonStatus, Role } from "../generated/prisma/enums";
import { PrismaService } from "../prisma/prisma.service";
import { dayEndUtc, dayStartUtc, utcAtMinuteOfDay } from "../common/date-utils";
import { CreateLessonDto } from "./dto/create-lesson.dto";
import { AssignVehicleDto } from "./dto/assign-vehicle.dto";
import { LESSON_SELECT } from "./lesson.selects";
import { toLessonDto } from "./lesson.mappers";

@Injectable()
export class LessonService {
  constructor(private readonly prisma: PrismaService) {}

  async getStudentProfileId(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { studentProfile: { select: { id: true } } },
    });

    if (!user?.studentProfile) {
      throw new NotFoundException("Student profile not found");
    }

    return user.studentProfile.id;
  }

  async getAvailableInstructors(
    schoolId: string,
    enrollmentId: string,
    studentProfileId: string,
  ): Promise<AvailableInstructorDto[]> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId, schoolId },
      select: { studentProfileId: true, courseId: true },
    });

    if (!enrollment) {
      throw new NotFoundException("Enrollment not found");
    }

    if (enrollment.studentProfileId !== studentProfileId) {
      throw new ForbiddenException("Enrollment does not belong to student");
    }

    const instructors = await this.prisma.instructorProfile.findMany({
      where: {
        user: { schoolId, status: "ACTIVE" },
        courses: { some: { id: enrollment.courseId } },
      },
      select: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return instructors.map(({ user }) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
    }));
  }

  async getAvailableSlots(
    schoolId: string,
    enrollmentId: string,
    instructorUserId: string,
    date: Date,
    studentProfileId: string,
  ): Promise<AvailableSlotDto[]> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId, schoolId },
      select: {
        studentProfileId: true,
        status: true,
        courseId: true,
        course: { select: { categoryId: true, transmission: true } },
      },
    });

    if (!enrollment) {
      throw new NotFoundException("Enrollment not found");
    }

    if (enrollment.studentProfileId !== studentProfileId) {
      throw new ForbiddenException("Enrollment does not belong to student");
    }

    if (enrollment.status !== "ACTIVE") {
      throw new BadRequestException("Enrollment is not active");
    }

    const instructorProfile = await this.prisma.instructorProfile.findFirst({
      where: {
        user: { id: instructorUserId, schoolId },
        courses: { some: { id: enrollment.courseId } },
      },
      select: { id: true },
    });

    if (!instructorProfile) {
      throw new NotFoundException(
        "Instructor not found or does not teach this course",
      );
    }

    const schoolConfig = await this.prisma.schoolConfig.findUnique({
      where: { schoolId },
      select: { defaultLessonDurationMin: true },
    });

    const durationMin = schoolConfig?.defaultLessonDurationMin ?? 120;

    const jsDay = date.getUTCDay();
    const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;

    const availability = await this.prisma.instructorAvailability.findMany({
      where: { instructorId: instructorProfile.id, dayOfWeek },
      orderBy: { startTime: "asc" },
    });

    if (availability.length === 0) {
      return [];
    }

    const dayStart = dayStartUtc(date);
    const dayEnd = dayEndUtc(date);

    const existingLessons = await this.prisma.lesson.findMany({
      where: {
        instructorId: instructorProfile.id,
        status: LessonStatus.SCHEDULED,
        startTime: { gte: dayStart },
        endTime: { lte: dayEnd },
      },
      select: { startTime: true, endTime: true, vehicleId: true },
    });

    // Count total vehicles matching course category + transmission for this school
    const totalVehicles = await this.prisma.vehicle.count({
      where: {
        schoolId,
        categoryId: enrollment.course.categoryId,
        transmission: enrollment.course.transmission,
      },
    });

    // Get all scheduled lessons for the day in this school (for vehicle availability)
    const schoolLessonsForDay = await this.prisma.lesson.findMany({
      where: {
        schoolId,
        status: LessonStatus.SCHEDULED,
        startTime: { lt: dayEnd },
        endTime: { gt: dayStart },
        vehicleId: { not: null },
      },
      select: { startTime: true, endTime: true },
    });

    // Get existing SCHEDULED lessons for this student on that day
    const studentLessons = await this.prisma.lesson.findMany({
      where: {
        enrollment: { studentProfileId },
        status: LessonStatus.SCHEDULED,
        startTime: { gte: dayStart },
        endTime: { lte: dayEnd },
      },
      select: { startTime: true, endTime: true },
    });

    const slots: AvailableSlotDto[] = [];

    for (const window of availability) {
      const [startH, startM] = window.startTime.split(":").map(Number);
      const [endH, endM] = window.endTime.split(":").map(Number);

      const windowStartMin = startH * 60 + startM;
      const windowEndMin = endH * 60 + endM;

      for (
        let slotStart = windowStartMin;
        slotStart + durationMin <= windowEndMin;
        slotStart += durationMin
      ) {
        const slotEnd = slotStart + durationMin;

        const slotStartTime = utcAtMinuteOfDay(date, slotStart);
        const slotEndTime = utcAtMinuteOfDay(date, slotEnd);

        // Check instructor conflict
        const hasInstructorConflict = existingLessons.some(
          (lesson) =>
            slotStartTime < lesson.endTime && slotEndTime > lesson.startTime,
        );

        if (hasInstructorConflict) {
          continue;
        }

        // Check student conflict
        const hasStudentConflict = studentLessons.some(
          (lesson) =>
            slotStartTime < lesson.endTime && slotEndTime > lesson.startTime,
        );

        if (hasStudentConflict) {
          continue;
        }

        // Check vehicle availability
        const bookedVehicles = schoolLessonsForDay.filter(
          (lesson) =>
            slotStartTime < lesson.endTime && slotEndTime > lesson.startTime,
        ).length;

        if (totalVehicles - bookedVehicles <= 0) {
          continue;
        }

        slots.push({
          startTime: `${pad(Math.floor(slotStart / 60))}:${pad(slotStart % 60)}`,
          endTime: `${pad(Math.floor(slotEnd / 60))}:${pad(slotEnd % 60)}`,
        });
      }
    }

    return slots;
  }

  async create(
    schoolId: string,
    userId: string,
    studentProfileId: string,
    dto: CreateLessonDto,
  ): Promise<LessonDto> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: dto.enrollmentId, schoolId },
      select: {
        studentProfileId: true,
        status: true,
        courseId: true,
        course: { select: { categoryId: true, transmission: true } },
      },
    });

    if (!enrollment) {
      throw new NotFoundException("Enrollment not found");
    }

    if (enrollment.studentProfileId !== studentProfileId) {
      throw new ForbiddenException("Enrollment does not belong to student");
    }

    if (enrollment.status !== "ACTIVE") {
      throw new BadRequestException("Enrollment is not active");
    }

    const instructorProfile = await this.prisma.instructorProfile.findFirst({
      where: {
        user: { id: dto.instructorId, schoolId, status: "ACTIVE" },
        courses: { some: { id: enrollment.courseId } },
      },
      select: { id: true },
    });

    if (!instructorProfile) {
      throw new NotFoundException(
        "Instructor not found, inactive, or does not teach this course",
      );
    }

    const schoolConfig = await this.prisma.schoolConfig.findUnique({
      where: { schoolId },
      select: { defaultLessonDurationMin: true },
    });

    const durationMin = schoolConfig?.defaultLessonDurationMin ?? 120;

    const startTime = new Date(dto.startTime);
    const endTime = new Date(startTime.getTime() + durationMin * 60 * 1000);

    // Check instructor conflict
    const instructorConflict = await this.prisma.lesson.findFirst({
      where: {
        instructorId: instructorProfile.id,
        status: LessonStatus.SCHEDULED,
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });

    if (instructorConflict) {
      throw new BadRequestException(
        "Instructor has a conflicting lesson at this time",
      );
    }

    // Check student conflict
    const studentConflict = await this.prisma.lesson.findFirst({
      where: {
        enrollment: { studentProfileId },
        status: LessonStatus.SCHEDULED,
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });

    if (studentConflict) {
      throw new BadRequestException(
        "You already have a lesson scheduled at this time",
      );
    }

    // Check vehicle availability
    const totalVehicles = await this.prisma.vehicle.count({
      where: {
        schoolId,
        categoryId: enrollment.course.categoryId,
        transmission: enrollment.course.transmission,
      },
    });

    const bookedVehicles = await this.prisma.lesson.count({
      where: {
        schoolId,
        status: LessonStatus.SCHEDULED,
        vehicleId: { not: null },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });

    if (totalVehicles - bookedVehicles <= 0) {
      throw new BadRequestException("No vehicles available at this time");
    }

    const lesson = await this.prisma.lesson.create({
      data: {
        schoolId,
        enrollmentId: dto.enrollmentId,
        instructorId: instructorProfile.id,
        startTime,
        endTime,
        status: LessonStatus.SCHEDULED,
      },
      select: LESSON_SELECT,
    });

    return toLessonDto(lesson);
  }

  async findAll(
    schoolId: string,
    role: string,
    userId: string,
    filters: { status?: string; from?: string; to?: string },
  ): Promise<LessonDto[]> {
    const where: Record<string, unknown> = { schoolId };

    if (role === Role.STUDENT) {
      const studentProfileId = await this.getStudentProfileId(userId);
      where.enrollment = { studentProfileId };
    } else if (role === Role.INSTRUCTOR) {
      const instructorProfile = await this.prisma.instructorProfile.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!instructorProfile) {
        throw new NotFoundException("Instructor profile not found");
      }

      where.instructorId = instructorProfile.id;
    }
    // ADMIN sees all school lessons — no additional filter

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.from) {
      where.startTime = {
        ...(where.startTime as object),
        gte: new Date(filters.from),
      };
    }

    if (filters.to) {
      where.endTime = {
        ...(where.endTime as object),
        lte: new Date(filters.to),
      };
    }

    const lessons = await this.prisma.lesson.findMany({
      where,
      select: LESSON_SELECT,
      orderBy: { startTime: "desc" },
    });

    return lessons.map(toLessonDto);
  }

  async complete(schoolId: string, lessonId: string): Promise<LessonDto> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId, schoolId },
      select: {
        id: true,
        status: true,
        startTime: true,
        endTime: true,
        enrollmentId: true,
        enrollment: {
          select: { hoursPurchased: true, hoursCompleted: true },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException("Lesson not found");
    }

    if (lesson.status !== LessonStatus.SCHEDULED) {
      throw new BadRequestException("Only scheduled lessons can be completed");
    }

    const durationMs = lesson.endTime.getTime() - lesson.startTime.getTime();
    const lessonHours = durationMs / (1000 * 60 * 60);

    const newHoursCompleted =
      Number(lesson.enrollment.hoursCompleted) + lessonHours;
    const hoursPurchased = Number(lesson.enrollment.hoursPurchased);

    const enrollmentCompleted = newHoursCompleted >= hoursPurchased;

    const [updatedLesson] = await this.prisma.$transaction([
      this.prisma.lesson.update({
        where: { id: lessonId },
        data: {
          status: LessonStatus.COMPLETED,
          completedAt: new Date(),
        },
        select: LESSON_SELECT,
      }),
      this.prisma.enrollment.update({
        where: { id: lesson.enrollmentId },
        data: {
          hoursCompleted: { increment: lessonHours },
          ...(enrollmentCompleted && { status: "COMPLETED" }),
        },
      }),
    ]);

    return toLessonDto(updatedLesson);
  }

  async cancel(
    schoolId: string,
    lessonId: string,
    cancelledByUserId: string,
  ): Promise<LessonDto> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId, schoolId },
      select: { id: true, status: true },
    });

    if (!lesson) {
      throw new NotFoundException("Lesson not found");
    }

    if (lesson.status !== LessonStatus.SCHEDULED) {
      throw new BadRequestException("Only scheduled lessons can be cancelled");
    }

    const updated = await this.prisma.lesson.update({
      where: { id: lessonId },
      data: {
        status: LessonStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelledBy: cancelledByUserId,
      },
      select: LESSON_SELECT,
    });

    return toLessonDto(updated);
  }

  async assignVehicle(
    schoolId: string,
    lessonId: string,
    dto: AssignVehicleDto,
  ): Promise<LessonDto> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId, schoolId },
      select: {
        id: true,
        status: true,
        startTime: true,
        endTime: true,
        enrollment: {
          select: {
            course: { select: { categoryId: true, transmission: true } },
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException("Lesson not found");
    }

    if (lesson.status !== LessonStatus.SCHEDULED) {
      throw new BadRequestException(
        "Can only assign vehicles to scheduled lessons",
      );
    }

    const { categoryId, transmission } = lesson.enrollment.course;

    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: dto.vehicleId },
      select: {
        id: true,
        schoolId: true,
        categoryId: true,
        transmission: true,
      },
    });

    if (!vehicle) {
      throw new NotFoundException("Vehicle not found");
    }

    if (vehicle.schoolId !== schoolId) {
      throw new BadRequestException("Vehicle does not belong to this school");
    }

    if (vehicle.categoryId !== categoryId) {
      throw new BadRequestException(
        "Vehicle category does not match the course category",
      );
    }

    if (vehicle.transmission !== transmission) {
      throw new BadRequestException(
        "Vehicle transmission does not match the course transmission",
      );
    }

    // Check vehicle not booked at that time (exclude current lesson)
    const conflicting = await this.prisma.lesson.findFirst({
      where: {
        vehicleId: dto.vehicleId,
        status: LessonStatus.SCHEDULED,
        id: { not: lessonId },
        startTime: { lt: lesson.endTime },
        endTime: { gt: lesson.startTime },
      },
    });

    if (conflicting) {
      throw new BadRequestException("Vehicle is already booked at this time");
    }

    const updated = await this.prisma.lesson.update({
      where: { id: lessonId },
      data: { vehicleId: dto.vehicleId },
      select: LESSON_SELECT,
    });

    return toLessonDto(updated);
  }
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}
