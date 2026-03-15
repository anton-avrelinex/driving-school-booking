import { Injectable } from "@nestjs/common";
import {
  type CreateUserResponseDto,
  type UserDto,
  ROLES,
} from "@driving-school-booking/shared-types";
import { PrismaService } from "../prisma/prisma.service";
import { UserService } from "../user/user.service";
import { USER_SELECT } from "../user/user.selects";
import { toUserDto } from "../user/user.mappers";
import { CreateAdminDto } from "./dto/create-admin.dto";
import { UpdateAdminDto } from "./dto/update-admin.dto";

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  async create(
    schoolId: string,
    dto: CreateAdminDto,
  ): Promise<CreateUserResponseDto> {
    const { user, temporaryPassword } = await this.userService.createUserBase(
      schoolId,
      dto.email,
      dto.firstName,
      dto.lastName,
      ROLES.ADMIN,
      { adminProfile: { create: {} } },
    );

    return { ...user, temporaryPassword };
  }

  async update(
    schoolId: string,
    userId: string,
    dto: UpdateAdminDto,
  ): Promise<UserDto> {
    await this.userService.findOne(schoolId, userId);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: USER_SELECT,
    });

    return toUserDto(user);
  }
}
