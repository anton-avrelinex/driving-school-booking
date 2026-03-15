import { randomBytes } from "crypto";
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { type UserDto, type Role } from "@driving-school-booking/shared-types";
import { PrismaService } from "../prisma/prisma.service";
import { USER_SELECT } from "./user.selects";
import { toUserDto } from "./user.mappers";
import { ListUsersQueryDto } from "./dto/list-users-query.dto";
import { UserStatus } from "../generated/prisma/enums";

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async createUserBase(
    schoolId: string,
    email: string,
    firstName: string,
    lastName: string,
    role: Role,
    profileData: Record<string, unknown>,
  ): Promise<{
    user: UserDto;
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
