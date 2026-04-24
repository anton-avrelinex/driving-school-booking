import type { RecentActivityType } from "./constants";

export interface LessonsOverTimeEntryDto {
  date: string;
  scheduled: number;
  completed: number;
  cancelled: number;
}

export interface RecentActivityEntryDto {
  id: string;
  type: RecentActivityType;
  timestamp: string;
  studentName: string;
  instructorName: string;
}

export interface AdminDashboardStatsDto {
  activeStudents: number;
  activeInstructors: number;
  lessonsThisWeek: number;
  completionRate: number;
  lessonsOverTime: LessonsOverTimeEntryDto[];
  recentActivity: RecentActivityEntryDto[];
}
