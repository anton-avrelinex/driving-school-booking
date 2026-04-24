import { Injectable } from "@nestjs/common";
import type { AdminDashboardStatsDto } from "@driving-school-booking/shared-types";
import { LessonStatus, Role, UserStatus } from "../generated/prisma/enums";
import { PrismaService } from "../prisma/prisma.service";
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
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    const chartFrom = startOfDaysAgo(now, CHART_DAYS - 1);

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

function startOfWeek(d: Date): Date {
  const result = new Date(d);
  result.setHours(0, 0, 0, 0);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  return result;
}

function endOfWeek(d: Date): Date {
  const start = startOfWeek(d);
  const result = new Date(start);
  result.setDate(start.getDate() + 6);
  result.setHours(23, 59, 59, 999);
  return result;
}

function startOfDaysAgo(d: Date, daysAgo: number): Date {
  const result = new Date(d);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - daysAgo);
  return result;
}
