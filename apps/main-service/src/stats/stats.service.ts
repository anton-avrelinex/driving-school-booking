import { Injectable } from "@nestjs/common";
import type { AdminDashboardStatsDto } from "@driving-school-booking/shared-types";
import { LessonStatus, Role, UserStatus } from "../generated/prisma/enums";
import { PrismaService } from "../prisma/prisma.service";
import {
  addUtcDays,
  dayStartUtc,
  endOfUtcWeek,
  startOfUtcWeek,
} from "../common/date-utils";
import { RECENT_ACTIVITY_SELECT } from "./stats.selects";
import { bucketLessonsByDay, toRecentActivityEntry } from "./stats.mappers";

const CHART_DAYS = 30;
const RECENT_ACTIVITY_LIMIT = 10;

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAdminDashboardStats(
    schoolId: string,
  ): Promise<AdminDashboardStatsDto> {
    const now = new Date();
    const weekStart = startOfUtcWeek(now);
    const weekEnd = endOfUtcWeek(now);
    const chartFrom = dayStartUtc(addUtcDays(now, -(CHART_DAYS - 1)));

    const [
      activeStudents,
      activeInstructors,
      lessonsThisWeek,
      completedLast30,
      cancelledLast30,
      lessonsForChart,
      recentLessons,
    ] = await Promise.all([
      this.prisma.user.count({
        where: { schoolId, role: Role.STUDENT, status: UserStatus.ACTIVE },
      }),
      this.prisma.user.count({
        where: { schoolId, role: Role.INSTRUCTOR, status: UserStatus.ACTIVE },
      }),
      this.prisma.lesson.count({
        where: {
          schoolId,
          startTime: { gte: weekStart, lte: weekEnd },
          status: { not: LessonStatus.CANCELLED },
        },
      }),
      this.prisma.lesson.count({
        where: {
          schoolId,
          status: LessonStatus.COMPLETED,
          startTime: { gte: chartFrom, lte: now },
        },
      }),
      this.prisma.lesson.count({
        where: {
          schoolId,
          status: LessonStatus.CANCELLED,
          startTime: { gte: chartFrom, lte: now },
        },
      }),
      this.prisma.lesson.findMany({
        where: {
          schoolId,
          startTime: { gte: chartFrom, lte: now },
        },
        select: { startTime: true, status: true },
      }),
      this.prisma.lesson.findMany({
        where: { schoolId },
        orderBy: { updatedAt: "desc" },
        take: RECENT_ACTIVITY_LIMIT,
        select: RECENT_ACTIVITY_SELECT,
      }),
    ]);

    const totalFinalized = completedLast30 + cancelledLast30;
    const completionRate =
      totalFinalized === 0 ? 0 : completedLast30 / totalFinalized;

    return {
      activeStudents,
      activeInstructors,
      lessonsThisWeek,
      completionRate,
      lessonsOverTime: bucketLessonsByDay(lessonsForChart, chartFrom, now),
      recentActivity: recentLessons.map(toRecentActivityEntry),
    };
  }
}
