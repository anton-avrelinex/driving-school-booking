import type {
  CourseDto,
  UserDto,
  VehicleDto,
  EnrollmentDto,
  InstructorAvailabilityDto,
} from "@driving-school-booking/shared-types";

function toCourseDto(c: {
  id: string;
  name: string;
  price: unknown;
  hours: number;
  categoryId: string;
  transmission: string;
}): CourseDto {
  return {
    id: c.id,
    name: c.name,
    price: Number(c.price),
    hours: c.hours,
    categoryId: c.categoryId,
    transmission: c.transmission as CourseDto["transmission"],
  };
}

export function toUserDto(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  createdAt: Date;
  instructorProfile?: {
    id: string;
    courses: {
      id: string;
      name: string;
      price: unknown;
      hours: number;
      categoryId: string;
      transmission: string;
    }[];
    vehicles: VehicleDto[];
    availability?: InstructorAvailabilityDto[];
  } | null;
  studentProfile?: {
    id: string;
    enrollments: {
      id: string;
      courseId: string;
      course: {
        id: string;
        name: string;
        price: unknown;
        hours: number;
        categoryId: string;
        transmission: string;
      };
      hoursPurchased: unknown;
      hoursCompleted: unknown;
      status: string;
      createdAt: Date;
    }[];
  } | null;
  adminProfile?: {
    id: string;
  } | null;
}): UserDto {
  const dto: UserDto = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role as UserDto["role"],
    status: user.status as UserDto["status"],
    createdAt: user.createdAt.toISOString(),
  };

  if (user.instructorProfile) {
    dto.instructorProfile = {
      id: user.instructorProfile.id,
      courses: user.instructorProfile.courses.map(toCourseDto),
      vehicles: user.instructorProfile.vehicles,
      availability: user.instructorProfile.availability ?? [],
    };
  }

  if (user.studentProfile) {
    dto.studentProfile = {
      id: user.studentProfile.id,
      enrollments: user.studentProfile.enrollments.map(
        (e): EnrollmentDto => ({
          id: e.id,
          courseId: e.courseId,
          course: toCourseDto(e.course),
          hoursPurchased: Number(e.hoursPurchased),
          hoursCompleted: Number(e.hoursCompleted),
          status: e.status as EnrollmentDto["status"],
          createdAt: e.createdAt.toISOString(),
        }),
      ),
    };
  }

  if (user.adminProfile) {
    dto.adminProfile = {
      id: user.adminProfile.id,
    };
  }

  return dto;
}
