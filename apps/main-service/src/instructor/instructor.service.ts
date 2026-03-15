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
import { CreateInstructorDto } from "./dto/create-instructor.dto";
import { UpdateInstructorDto } from "./dto/update-instructor.dto";

@Injectable()
export class InstructorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  async create(
    schoolId: string,
    dto: CreateInstructorDto,
  ): Promise<CreateUserResponseDto> {
    const { user, temporaryPassword } = await this.userService.createUserBase(
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

  async update(
    schoolId: string,
    userId: string,
    dto: UpdateInstructorDto,
  ): Promise<UserDto> {
    await this.userService.findOne(schoolId, userId);

    const { courseIds, vehicleIds, ...rest } = dto;

    const updateData: Record<string, unknown> = { ...rest };

    if (courseIds || vehicleIds) {
      updateData.instructorProfile = {
        update: {
          ...(courseIds && {
            courses: { set: courseIds.map((id) => ({ id })) },
          }),
          ...(vehicleIds && {
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
}
