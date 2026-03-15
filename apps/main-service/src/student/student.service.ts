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
import { CreateStudentDto } from "./dto/create-student.dto";
import { UpdateStudentDto } from "./dto/update-student.dto";

@Injectable()
export class StudentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  async create(
    schoolId: string,
    dto: CreateStudentDto,
  ): Promise<CreateUserResponseDto> {
    const { user, temporaryPassword } = await this.userService.createUserBase(
      schoolId,
      dto.email,
      dto.firstName,
      dto.lastName,
      ROLES.STUDENT,
      { studentProfile: { create: {} } },
    );

    if (!dto.enrollmentCourseIds?.length) {
      return { ...user, temporaryPassword };
    }

    const courses = await this.prisma.course.findMany({
      where: { id: { in: dto.enrollmentCourseIds }, schoolId },
      select: { id: true, hours: true },
    });

    await this.prisma.enrollment.createMany({
      data: courses.map((course) => ({
        schoolId,
        studentProfileId: user.studentProfile!.id,
        courseId: course.id,
        hoursPurchased: course.hours,
      })),
    });

    const updated = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: USER_SELECT,
    });

    return { ...toUserDto(updated), temporaryPassword };
  }

  async update(
    schoolId: string,
    userId: string,
    dto: UpdateStudentDto,
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
