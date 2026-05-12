import { Injectable, NotFoundException } from "@nestjs/common";
import type {
  AvailableInstructorDto,
  AvailableSlotDto,
} from "@driving-school-booking/shared-types";
import { UserStatus } from "../generated/prisma/enums";
import { PrismaService } from "../prisma/prisma.service";
import { assertEnrollment } from "./lesson.assertions";
import { DEFAULT_LESSON_DURATION_MIN } from "./lesson.constants";
import { slotsQuery } from "./lesson.queries";

@Injectable()
export class LessonAvailabilityService {
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
    const enrollment = await assertEnrollment(
      this.prisma,
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
        instructorNumber: true,
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return instructors.map(({ user, instructorNumber }) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      instructorNumber,
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
    const enrollment = await assertEnrollment(
      this.prisma,
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
}
