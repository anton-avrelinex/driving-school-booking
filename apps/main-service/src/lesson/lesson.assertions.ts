import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { EnrollmentStatus } from "../generated/prisma/enums";
import { PrismaService } from "../prisma/prisma.service";

export async function assertEnrollment(
  prisma: PrismaService,
  schoolId: string,
  enrollmentId: string,
  studentProfileId: string,
  opts: { requireActive?: boolean } = {},
) {
  const enrollment = await prisma.enrollment.findUnique({
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
