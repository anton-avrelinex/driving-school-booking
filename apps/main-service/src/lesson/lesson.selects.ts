import { Prisma } from "../generated/prisma/client";

export const LESSON_SELECT = {
  id: true,
  enrollmentId: true,
  enrollment: {
    select: {
      course: { select: { name: true } },
      studentProfile: {
        select: {
          user: { select: { firstName: true, lastName: true } },
        },
      },
    },
  },
  instructor: {
    select: {
      user: { select: { firstName: true, lastName: true } },
    },
  },
  vehicleId: true,
  vehicle: {
    select: {
      make: true,
      model: true,
      licensePlate: true,
    },
  },
  startTime: true,
  endTime: true,
  status: true,
  cancelledAt: true,
  completedAt: true,
  createdAt: true,
} satisfies Prisma.LessonSelect;
