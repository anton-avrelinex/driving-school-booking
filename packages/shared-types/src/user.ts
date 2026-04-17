import type {
  Role,
  UserStatus,
  EnrollmentStatus,
  Transmission,
} from "./constants";

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

export interface InstructorAvailabilityDto {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface SetInstructorAvailabilityDto {
  slots: InstructorAvailabilityDto[];
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

export interface InstructorProfileDto {
  id: string;
  courses: CourseDto[];
  vehicles: VehicleDto[];
  availability: InstructorAvailabilityDto[];
}

export interface StudentProfileDto {
  id: string;
  enrollments: EnrollmentDto[];
}

export interface AdminProfileDto {
  id: string;
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

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface CreateUserResponseDto extends UserDto {
  temporaryPassword: string;
}
