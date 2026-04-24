export const ROLES = {
  ADMIN: "ADMIN",
  INSTRUCTOR: "INSTRUCTOR",
  STUDENT: "STUDENT",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const USER_STATUSES = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;

export type UserStatus = (typeof USER_STATUSES)[keyof typeof USER_STATUSES];

export const TRANSMISSIONS = {
  AUTOMATIC: "AUTOMATIC",
  MANUAL: "MANUAL",
} as const;

export type Transmission = (typeof TRANSMISSIONS)[keyof typeof TRANSMISSIONS];

export const ENROLLMENT_STATUSES = {
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
} as const;

export type EnrollmentStatus =
  (typeof ENROLLMENT_STATUSES)[keyof typeof ENROLLMENT_STATUSES];

export const LESSON_STATUSES = {
  SCHEDULED: "SCHEDULED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export type LessonStatus =
  (typeof LESSON_STATUSES)[keyof typeof LESSON_STATUSES];

export const RECENT_ACTIVITY_TYPES = {
  BOOKED: "BOOKED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export type RecentActivityType =
  (typeof RECENT_ACTIVITY_TYPES)[keyof typeof RECENT_ACTIVITY_TYPES];
