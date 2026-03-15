export type TypesAreEqual<T, U> = [T] extends [U]
  ? [U] extends [T]
    ? true
    : false
  : false;

export type AssertTrue<_T extends true> = true;

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

export interface CategoryDto {
  id: string;
  name: string;
}

export interface UpdateSchoolCategoriesDto {
  categoryIds: string[];
}

export interface CourseDto {
  id: string;
  name: string;
  price: number;
  hours: number;
  categoryId: string;
  transmission: Transmission;
}

export interface CreateCourseDto {
  name: string;
  price: number;
  hours: number;
  categoryId: string;
  transmission: Transmission;
}

export interface UpdateCourseDto {
  name?: string;
  price?: number;
  hours?: number;
  categoryId?: string;
  transmission?: Transmission;
}

export interface VehicleDto {
  id: string;
  make: string;
  model: string;
  licensePlate: string;
  transmission: Transmission;
  categoryId: string;
}

export interface CreateVehicleDto {
  make: string;
  model: string;
  licensePlate: string;
  transmission: Transmission;
  categoryId: string;
}

export interface UpdateVehicleDto {
  make?: string;
  model?: string;
  licensePlate?: string;
  transmission?: Transmission;
  categoryId?: string;
}

export interface InstructorProfileDto {
  id: string;
  courses: CourseDto[];
  vehicles: VehicleDto[];
}

export interface StudentProfileDto {
  id: string;
  enrollments: EnrollmentDto[];
}

export interface AdminProfileDto {
  id: string;
}

export interface EnrollmentDto {
  id: string;
  courseId: string;
  course: CourseDto;
  hoursPurchased: number;
  hoursCompleted: number;
  status: EnrollmentStatus;
  createdAt: string;
}

export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
  instructorProfile?: InstructorProfileDto;
  studentProfile?: StudentProfileDto;
  adminProfile?: AdminProfileDto;
}

export interface CreateStudentDto {
  email: string;
  firstName: string;
  lastName: string;
  enrollmentCourseIds?: string[];
}

export interface CreateInstructorDto {
  email: string;
  firstName: string;
  lastName: string;
  courseIds?: string[];
  vehicleIds?: string[];
}

export interface CreateAdminDto {
  email: string;
  firstName: string;
  lastName: string;
}

export interface UpdateStudentDto {
  email?: string;
  firstName?: string;
  lastName?: string;
}

export interface UpdateInstructorDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  courseIds?: string[];
  vehicleIds?: string[];
}

export interface UpdateAdminDto {
  email?: string;
  firstName?: string;
  lastName?: string;
}

export interface CreateUserResponseDto extends UserDto {
  temporaryPassword: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface RefreshDto {
  refreshToken: string;
}

export interface TokenResponseDto {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;
  schoolId: string;
  role: Role;
  mustChangePassword: boolean;
  exp: number;
}
