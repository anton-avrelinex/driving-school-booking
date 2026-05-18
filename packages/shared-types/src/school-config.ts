export interface SchoolConfigDto {
  cancelDeadlineDaysBefore: number;
  cancelDeadlineTime: string;
  lateCancelPenaltyPerHour: number;
  defaultLessonDurationMin: number;
  minBookingLeadHours: number;
  timezone: string;
  currency: string;
}

export interface UpdateSchoolConfigDto {
  cancelDeadlineDaysBefore?: number;
  cancelDeadlineTime?: string;
  lateCancelPenaltyPerHour?: number;
  defaultLessonDurationMin?: number;
  minBookingLeadHours?: number;
  timezone?: string;
  currency?: string;
}
