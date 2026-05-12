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
import {
  EnrollmentStatus,
  LessonStatus,
  Role,
  UserStatus,
} from "../generated/prisma/enums";
import { PrismaService } from "../prisma/prisma.service";
import { withSerializableRetry } from "../common/transactions";
import { CreateLessonDto } from "./dto/create-lesson.dto";
import { AssignVehicleDto } from "./dto/assign-vehicle.dto";
import { LESSON_SELECT } from "./lesson.selects";
import { toLessonDto } from "./lesson.mappers";
import { slotsQuery } from "./lesson.queries";

const DEFAULT_LESSON_DURATION_MIN = 120;

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
    const enrollment = await this.assertEnrollment(
      schoolId,
      enrollmentId,
      studentProfileId,
    );

    const instructors = await this.prisma.instructorProfile.findMany({
      where: {
        user: { schoolId, status: UserStatus.ACTIVE },
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

  async getSlots(
    schoolId: string,
    enrollmentId: string,
    studentProfileId: string,
    from: Date,
    to: Date,
    instructorUserId?: string,
  ): Promise<AvailableSlotDto[]> {
    const enrollment = await this.assertEnrollment(
      schoolId,
      enrollmentId,
      studentProfileId,
      { requireActive: true },
    );

    const schoolConfig = await this.prisma.schoolConfig.findUnique({
      where: { schoolId },
      select: { defaultLessonDurationMin: true, timezone: true },
    });

    return this.prisma.$queryRaw<AvailableSlotDto[]>(
      slotsQuery({
        schoolId,
        courseId: enrollment.courseId,
        from,
        to,
        instructorUserId: instructorUserId ?? null,
        studentProfileId,
        categoryId: enrollment.course.categoryId,
        transmission: enrollment.course.transmission,
        durationMin:
          schoolConfig?.defaultLessonDurationMin ?? DEFAULT_LESSON_DURATION_MIN,
        schoolTz: schoolConfig?.timezone ?? "UTC",
      }),
    );
  }

  async create(
    schoolId: string,
    studentProfileId: string,
    dto: CreateLessonDto,
  ): Promise<LessonDto> {
    const enrollment = await this.assertEnrollment(
      schoolId,
      dto.enrollmentId,
      studentProfileId,
      { requireActive: true },
    );

    const instructorProfile = await this.prisma.instructorProfile.findFirst({
      where: {
        user: { id: dto.instructorId, schoolId, status: UserStatus.ACTIVE },
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
    const durationMin =
      schoolConfig?.defaultLessonDurationMin ?? DEFAULT_LESSON_DURATION_MIN;

    const startTime = new Date(dto.startTime);
    const endTime = new Date(startTime.getTime() + durationMin * 60 * 1000);

    const lesson = await withSerializableRetry(this.prisma, async (tx) => {
      const instructorConflict = await tx.lesson.findFirst({
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

      const studentConflict = await tx.lesson.findFirst({
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

      const totalVehicles = await tx.vehicle.count({
        where: {
          schoolId,
          categoryId: enrollment.course.categoryId,
          transmission: enrollment.course.transmission,
        },
      });
      const bookedVehicles = await tx.lesson.count({
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

      return tx.lesson.create({
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

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.from) {
      where.startTime = { gte: new Date(filters.from) };
    }
    if (filters.to) {
      where.endTime = { lte: new Date(filters.to) };
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

    const lessonHours =
      (lesson.endTime.getTime() - lesson.startTime.getTime()) /
      (1000 * 60 * 60);

    const newHoursCompleted =
      Number(lesson.enrollment.hoursCompleted) + lessonHours;
    const enrollmentCompleted =
      newHoursCompleted >= Number(lesson.enrollment.hoursPurchased);

    const [updatedLesson] = await this.prisma.$transaction([
      this.prisma.lesson.update({
        where: { id: lessonId, status: LessonStatus.SCHEDULED },
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
          ...(enrollmentCompleted && { status: EnrollmentStatus.COMPLETED }),
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
      where: { id: lessonId, status: LessonStatus.SCHEDULED },
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

    const updated = await withSerializableRetry(this.prisma, async (tx) => {
      const conflicting = await tx.lesson.findFirst({
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

      return tx.lesson.update({
        where: { id: lessonId, status: LessonStatus.SCHEDULED },
        data: { vehicleId: dto.vehicleId },
        select: LESSON_SELECT,
      });
    });

    return toLessonDto(updated);
  }

  private async assertEnrollment(
    schoolId: string,
    enrollmentId: string,
    studentProfileId: string,
    opts: { requireActive?: boolean } = {},
  ) {
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
    if (opts.requireActive && enrollment.status !== EnrollmentStatus.ACTIVE) {
      throw new BadRequestException("Enrollment is not active");
    }
    return enrollment;
  }
}
