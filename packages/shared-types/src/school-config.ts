export interface SchoolConfigDto {
  cancelDeadlineDaysBefore: number;
  cancelDeadlineTime: string;
  lateCancelPenaltyPerHour: number;
  defaultLessonDurationMin: number;
  inviteExpiryHours: number;
  defaultReminderHours: number;
  timezone: string;
}

export interface UpdateSchoolConfigDto {
  cancelDeadlineDaysBefore?: number;
  cancelDeadlineTime?: string;
  lateCancelPenaltyPerHour?: number;
  defaultLessonDurationMin?: number;
  inviteExpiryHours?: number;
  defaultReminderHours?: number;
  timezone?: string;
}
