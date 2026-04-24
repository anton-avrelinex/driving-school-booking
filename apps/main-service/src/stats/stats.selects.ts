import { Prisma } from "../generated/prisma/client";

export const RECENT_ACTIVITY_SELECT = {
  id: true,
  status: true,
  updatedAt: true,
  instructor: {
    select: {
      user: { select: { firstName: true, lastName: true } },
    },
  },
  enrollment: {
    select: {
      studentProfile: {
        select: {
          user: { select: { firstName: true, lastName: true } },
        },
      },
    },
  },
} satisfies Prisma.LessonSelect;
