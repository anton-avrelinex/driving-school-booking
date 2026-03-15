import { randomBytes } from "crypto";
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import {
  type UserDto,
  type CreateUserResponseDto,
  type CourseDto,
  type VehicleDto,
  type EnrollmentDto,
  type Role,
  ROLES,
} from "@driving-school-booking/shared-types";
import { PrismaService } from "../prisma/prisma.service";
import { CreateStudentDto } from "./dto/create-student.dto";
import { CreateInstructorDto } from "./dto/create-instructor.dto";
import { CreateAdminDto } from "./dto/create-admin.dto";
import { UpdateStudentDto } from "./dto/update-student.dto";
import { UpdateInstructorDto } from "./dto/update-instructor.dto";
import { UpdateAdminDto } from "./dto/update-admin.dto";
import { ListUsersQueryDto } from "./dto/list-users-query.dto";
import { UserStatus } from "../generated/prisma/enums";

const COURSE_SELECT_IN_PROFILE = {
  id: true,
  name: true,
  price: true,
  hours: true,
  categoryId: true,
  transmission: true,
} as const;

const VEHICLE_SELECT_IN_PROFILE = {
  id: true,
  make: true,
  model: true,
  licensePlate: true,
  transmission: true,
  categoryId: true,
} as const;

const USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  status: true,
  createdAt: true,
  instructorProfile: {
    select: {
      id: true,
      courses: { select: COURSE_SELECT_IN_PROFILE },
      vehicles: { select: VEHICLE_SELECT_IN_PROFILE },
    },
  },
  studentProfile: {
    select: {
      id: true,
      enrollments: {
        select: {
          id: true,
          courseId: true,
          course: { select: COURSE_SELECT_IN_PROFILE },
          hoursPurchased: true,
          hoursCompleted: true,
          status: true,
          createdAt: true,
        },
      },
    },
  },
  adminProfile: {
    select: {
      id: true,
    },
  },
} as const;

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

function toUserDto(user: {
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

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  private async createUserBase(
    schoolId: string,
    email: string,
    firstName: string,
    lastName: string,
    role: Role,
    profileData: Record<string, unknown>,
  ): Promise<{
    user: ReturnType<typeof toUserDto> extends infer U ? U : never;
    temporaryPassword: string;
  }> {
    const existing = await this.prisma.user.findUnique({
      where: { schoolId_email: { schoolId, email } },
    });

    if (existing) {
      throw new ConflictException("A user with this email already exists");
    }

    const temporaryPassword = randomBytes(9).toString("base64url").slice(0, 12);
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    const user = await this.prisma.user.create({
      data: {
        schoolId,
        email,
        firstName,
        lastName,
        role,
        passwordHash,
        mustChangePassword: true,
        ...profileData,
      },
      select: USER_SELECT,
    });

    return { user: toUserDto(user), temporaryPassword };
  }

  async createStudent(
    schoolId: string,
    dto: CreateStudentDto,
  ): Promise<CreateUserResponseDto> {
    const { user, temporaryPassword } = await this.createUserBase(
      schoolId,
      dto.email,
      dto.firstName,
      dto.lastName,
      ROLES.STUDENT,
      { studentProfile: { create: {} } },
    );

    if (dto.enrollmentCourseIds?.length) {
      // Need to get the raw user to access studentProfile id
      const rawUser = await this.prisma.user.findUniqueOrThrow({
        where: { id: user.id },
        select: USER_SELECT,
      });

      if (rawUser.studentProfile) {
        const courses = await this.prisma.course.findMany({
          where: { id: { in: dto.enrollmentCourseIds }, schoolId },
          select: { id: true, hours: true },
        });

        await this.prisma.enrollment.createMany({
          data: courses.map((course) => ({
            schoolId,
            studentProfileId: rawUser.studentProfile!.id,
            courseId: course.id,
            hoursPurchased: course.hours,
          })),
        });

        // Refetch to include enrollments
        const updated = await this.prisma.user.findUniqueOrThrow({
          where: { id: user.id },
          select: USER_SELECT,
        });

        return { ...toUserDto(updated), temporaryPassword };
      }
    }

    return { ...user, temporaryPassword };
  }

  async createInstructor(
    schoolId: string,
    dto: CreateInstructorDto,
  ): Promise<CreateUserResponseDto> {
    const { user, temporaryPassword } = await this.createUserBase(
      schoolId,
      dto.email,
      dto.firstName,
      dto.lastName,
      ROLES.INSTRUCTOR,
      {
        instructorProfile: {
          create: {
            ...(dto.courseIds && {
              courses: { connect: dto.courseIds.map((id) => ({ id })) },
            }),
            ...(dto.vehicleIds && {
              vehicles: { connect: dto.vehicleIds.map((id) => ({ id })) },
            }),
          },
        },
      },
    );

    return { ...user, temporaryPassword };
  }

  async createAdmin(
    schoolId: string,
    dto: CreateAdminDto,
  ): Promise<CreateUserResponseDto> {
    const { user, temporaryPassword } = await this.createUserBase(
      schoolId,
      dto.email,
      dto.firstName,
      dto.lastName,
      ROLES.ADMIN,
      { adminProfile: { create: {} } },
    );

    return { ...user, temporaryPassword };
  }

  async findAll(
    schoolId: string,
    query: ListUsersQueryDto,
  ): Promise<UserDto[]> {
    const where: { role?: Role; schoolId: string } = { schoolId };

    if (query.role) {
      where.role = query.role;
    }

    const users = await this.prisma.user.findMany({
      where,
      select: USER_SELECT,
      orderBy: { lastName: "asc" },
    });

    return users.map(toUserDto);
  }

  async findOne(schoolId: string, userId: string): Promise<UserDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, schoolId },
      select: USER_SELECT,
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return toUserDto(user);
  }

  async updateStudent(
    schoolId: string,
    userId: string,
    dto: UpdateStudentDto,
  ): Promise<UserDto> {
    await this.findOne(schoolId, userId);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: USER_SELECT,
    });

    return toUserDto(user);
  }

  async updateInstructor(
    schoolId: string,
    userId: string,
    dto: UpdateInstructorDto,
  ): Promise<UserDto> {
    await this.findOne(schoolId, userId);

    const { courseIds, vehicleIds, ...rest } = dto;

    const updateData: Record<string, unknown> = { ...rest };

    if (courseIds !== undefined || vehicleIds !== undefined) {
      updateData.instructorProfile = {
        update: {
          ...(courseIds !== undefined && {
            courses: { set: courseIds.map((id) => ({ id })) },
          }),
          ...(vehicleIds !== undefined && {
            vehicles: { set: vehicleIds.map((id) => ({ id })) },
          }),
        },
      };
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: USER_SELECT,
    });

    return toUserDto(user);
  }

  async updateAdmin(
    schoolId: string,
    userId: string,
    dto: UpdateAdminDto,
  ): Promise<UserDto> {
    await this.findOne(schoolId, userId);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: USER_SELECT,
    });

    return toUserDto(user);
  }

  async deactivate(schoolId: string, userId: string): Promise<UserDto> {
    await this.findOne(schoolId, userId);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.INACTIVE },
      select: USER_SELECT,
    });

    return toUserDto(user);
  }
}
