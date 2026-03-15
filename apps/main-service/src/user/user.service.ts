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
  type Role,
  ROLES,
} from "@driving-school-booking/shared-types";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { ListUsersQueryDto } from "./dto/list-users-query.dto";
import { UserStatus } from "../generated/prisma/enums";

const USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  status: true,
  createdAt: true,
} as const;

const USER_WITH_RELATIONS_SELECT = {
  ...USER_SELECT,
  courses: {
    select: {
      id: true,
      name: true,
      price: true,
      hours: true,
      categoryId: true,
      transmission: true,
    },
  },
  vehicles: {
    select: {
      id: true,
      make: true,
      model: true,
      licensePlate: true,
      transmission: true,
      categoryId: true,
    },
  },
} as const;

function toUserDto(
  user: Omit<UserDto, "createdAt" | "courses" | "vehicles"> & {
    createdAt: Date;
    courses?: {
      id: string;
      name: string;
      price: unknown;
      hours: number;
      categoryId: string;
      transmission: string;
    }[];
    vehicles?: VehicleDto[];
  },
): UserDto {
  const dto: UserDto = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
  };

  if (user.courses) {
    dto.courses = user.courses.map(
      (c): CourseDto => ({
        id: c.id,
        name: c.name,
        price: Number(c.price),
        hours: c.hours,
        categoryId: c.categoryId,
        transmission: c.transmission as CourseDto["transmission"],
      }),
    );
  }

  if (user.vehicles) {
    dto.vehicles = user.vehicles;
  }

  return dto;
}

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    schoolId: string,
    dto: CreateUserDto,
  ): Promise<CreateUserResponseDto> {
    const existing = await this.prisma.user.findUnique({
      where: { schoolId_email: { schoolId, email: dto.email } },
    });

    if (existing) {
      throw new ConflictException("A user with this email already exists");
    }

    const temporaryPassword = randomBytes(9).toString("base64url").slice(0, 12);
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    const user = await this.prisma.user.create({
      data: {
        schoolId,
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
        passwordHash,
        mustChangePassword: true,
        ...(dto.courseIds && {
          courses: { connect: dto.courseIds.map((id) => ({ id })) },
        }),
        ...(dto.vehicleIds && {
          vehicles: { connect: dto.vehicleIds.map((id) => ({ id })) },
        }),
      },
      select: USER_WITH_RELATIONS_SELECT,
    });

    return {
      ...toUserDto(user),
      temporaryPassword,
    };
  }

  async findAll(
    schoolId: string,
    query: ListUsersQueryDto,
  ): Promise<UserDto[]> {
    const where: { role?: Role; schoolId: string } = { schoolId };

    if (query.role) {
      where.role = query.role;
    }

    const isInstructor = query.role === ROLES.INSTRUCTOR;

    const users = await this.prisma.user.findMany({
      where,
      select: isInstructor ? USER_WITH_RELATIONS_SELECT : USER_SELECT,
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

  async update(
    schoolId: string,
    userId: string,
    dto: UpdateUserDto,
  ): Promise<UserDto> {
    await this.findOne(schoolId, userId);

    const { courseIds, vehicleIds, ...rest } = dto;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...rest,
        ...(courseIds !== undefined && {
          courses: { set: courseIds.map((id) => ({ id })) },
        }),
        ...(vehicleIds !== undefined && {
          vehicles: { set: vehicleIds.map((id) => ({ id })) },
        }),
      },
      select: USER_WITH_RELATIONS_SELECT,
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
