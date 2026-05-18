import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Decimal } from "@prisma/client/runtime/client";
import type {
  CancellationInfoDto,
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
import { assertEnrollment } from "./lesson.assertions";
import {
  ACTIVE_LESSON_STATUSES,
  DEFAULT_LESSON_DURATION_MIN,
} from "./lesson.constants";
import { computeCancelDeadlineUtc } from "./lesson.deadline";
import { LESSON_SELECT } from "./lesson.selects";
import { toLessonDto } from "./lesson.mappers";

@Injectable()
export class LessonLifecycleService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    schoolId: string,
    role: string,
    userId: string,
    filters: { status?: string; from?: string; to?: string },
  ): Promise<LessonDto[]> {
    const where: Record<string, unknown> = { schoolId };

    if (role === Role.STUDENT) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { studentProfile: { select: { id: true } } },
      });
      if (!user?.studentProfile) {
        throw new NotFoundException("Student profile not found");
      }
      where.enrollment = { studentProfileId: user.studentProfile.id };
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

  async create(
    schoolId: string,
    studentProfileId: string,
    dto: CreateLessonDto,
  ): Promise<LessonDto> {
    const enrollment = await assertEnrollment(
      this.prisma,
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
          status: { in: ACTIVE_LESSON_STATUSES },
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
          status: { in: ACTIVE_LESSON_STATUSES },
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
          status: { in: ACTIVE_LESSON_STATUSES },
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
          status: LessonStatus.PENDING,
        },
        select: LESSON_SELECT,
      });
    });

    return toLessonDto(lesson);
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
    callerRole: Role,
  ): Promise<LessonDto> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId, schoolId },
      select: {
        id: true,
        status: true,
        startTime: true,
        endTime: true,
        enrollment: { select: { studentProfileId: true } },
        school: { select: { config: true } },
      },
    });

    if (!lesson) {
      throw new NotFoundException("Lesson not found");
    }

    if (!ACTIVE_LESSON_STATUSES.includes(lesson.status)) {
      throw new BadRequestException(
        "Only pending or scheduled lessons can be cancelled",
      );
    }

    const fee = resolveCancellationFee(
      callerRole,
      lesson,
      lesson.school.config,
    );

    const [updated] = await this.prisma.$transaction([
      this.prisma.lesson.update({
        where: { id: lessonId, status: { in: ACTIVE_LESSON_STATUSES } },
        data: {
          status: LessonStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelledBy: cancelledByUserId,
        },
        select: LESSON_SELECT,
      }),
      this.prisma.studentProfile.update({
        where: { id: lesson.enrollment.studentProfileId },
        data: { outstandingBalance: { increment: fee } },
      }),
    ]);

    return toLessonDto(updated);
  }

  async getCancellationInfo(
    schoolId: string,
    lessonId: string,
    callerRole: Role,
  ): Promise<CancellationInfoDto> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId, schoolId },
      select: {
        status: true,
        startTime: true,
        endTime: true,
        school: { select: { config: true } },
      },
    });

    if (!lesson) {
      throw new NotFoundException("Lesson not found");
    }
    if (!ACTIVE_LESSON_STATUSES.includes(lesson.status)) {
      throw new BadRequestException("Lesson is not cancellable");
    }
    if (!lesson.school.config) {
      throw new BadRequestException("School config missing");
    }

    const subjectToFeePolicy =
      callerRole === Role.STUDENT && lesson.status === LessonStatus.SCHEDULED;
    const deadlineAt = subjectToFeePolicy
      ? computeCancelDeadlineUtc(
          lesson.startTime,
          lesson.school.config,
        ).toISOString()
      : null;
    const fee = resolveCancellationFee(
      callerRole,
      lesson,
      lesson.school.config,
    );

    return { deadlineAt, fee };
  }

  async getAvailableVehicles(
    schoolId: string,
    lessonId: string,
    callerUserId: string,
    callerRole: Role,
  ) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId, schoolId },
      select: {
        id: true,
        status: true,
        startTime: true,
        endTime: true,
        instructor: { select: { userId: true } },
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
    if (
      callerRole === Role.INSTRUCTOR &&
      lesson.instructor.userId !== callerUserId
    ) {
      throw new ForbiddenException("Not your lesson");
    }

    const { categoryId, transmission } = lesson.enrollment.course;

    return this.prisma.vehicle.findMany({
      where: {
        schoolId,
        categoryId,
        transmission,
        lessons: {
          none: {
            status: { in: ACTIVE_LESSON_STATUSES },
            id: { not: lessonId },
            startTime: { lt: lesson.endTime },
            endTime: { gt: lesson.startTime },
          },
        },
      },
      select: {
        id: true,
        make: true,
        model: true,
        licensePlate: true,
        transmission: true,
        categoryId: true,
      },
      orderBy: [{ make: "asc" }, { model: "asc" }],
    });
  }

  async confirm(
    schoolId: string,
    lessonId: string,
    callerUserId: string,
    callerRole: Role,
  ): Promise<LessonDto> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId, schoolId },
      select: {
        id: true,
        status: true,
        instructor: { select: { userId: true } },
      },
    });

    if (!lesson) {
      throw new NotFoundException("Lesson not found");
    }
    if (lesson.status !== LessonStatus.PENDING) {
      throw new BadRequestException("Only pending lessons can be confirmed");
    }
    if (
      callerRole === Role.INSTRUCTOR &&
      lesson.instructor.userId !== callerUserId
    ) {
      throw new ForbiddenException("Not your lesson");
    }

    const updated = await this.prisma.lesson.update({
      where: { id: lessonId, status: LessonStatus.PENDING },
      data: {
        status: LessonStatus.SCHEDULED,
        confirmedAt: new Date(),
      },
      select: LESSON_SELECT,
    });

    return toLessonDto(updated);
  }

  async reject(
    schoolId: string,
    lessonId: string,
    callerUserId: string,
    callerRole: Role,
  ): Promise<LessonDto> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId, schoolId },
      select: {
        id: true,
        status: true,
        instructor: { select: { userId: true } },
      },
    });

    if (!lesson) {
      throw new NotFoundException("Lesson not found");
    }
    if (lesson.status !== LessonStatus.PENDING) {
      throw new BadRequestException("Only pending lessons can be rejected");
    }
    if (
      callerRole === Role.INSTRUCTOR &&
      lesson.instructor.userId !== callerUserId
    ) {
      throw new ForbiddenException("Not your lesson");
    }

    const updated = await this.prisma.lesson.update({
      where: { id: lessonId, status: LessonStatus.PENDING },
      data: {
        status: LessonStatus.REJECTED,
        rejectedAt: new Date(),
        rejectedBy: callerUserId,
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
          status: { in: ACTIVE_LESSON_STATUSES },
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
}

function resolveCancellationFee(
  callerRole: Role,
  lesson: { status: LessonStatus; startTime: Date; endTime: Date },
  config: {
    cancelDeadlineDaysBefore: number;
    cancelDeadlineTime: string;
    timezone: string;
    lateCancelPenaltyPerHour: Decimal | number;
  } | null,
): number {
  if (
    callerRole !== Role.STUDENT ||
    lesson.status !== LessonStatus.SCHEDULED ||
    !config
  ) {
    return 0;
  }

  const deadline = computeCancelDeadlineUtc(lesson.startTime, config);
  if (new Date() <= deadline) {
    return 0;
  }

  const hours =
    (lesson.endTime.getTime() - lesson.startTime.getTime()) / (1000 * 60 * 60);
  return Number(config.lateCancelPenaltyPerHour) * hours;
}
