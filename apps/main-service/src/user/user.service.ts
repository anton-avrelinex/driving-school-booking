import { randomBytes } from "crypto";
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import type {
  UserDto,
  CreateUserResponseDto,
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

function toUserDto(user: Omit<UserDto, "createdAt"> & { createdAt: Date }): UserDto {
  return { ...user, createdAt: user.createdAt.toISOString() };
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
      },
      select: USER_SELECT,
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
    const where: any = { schoolId };

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

  async update(
    schoolId: string,
    userId: string,
    dto: UpdateUserDto,
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
