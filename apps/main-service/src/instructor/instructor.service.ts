import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
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
import {
  InstructorAvailabilityDto,
  SetInstructorAvailabilityDto,
} from "./dto/set-instructor-availability.dto";
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

  async getAvailability(
    schoolId: string,
    userId: string,
  ): Promise<InstructorAvailabilityDto[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, schoolId },
      select: {
        instructorProfile: {
          select: { id: true },
        },
      },
    });

    if (!user?.instructorProfile) {
      throw new NotFoundException("Instructor not found");
    }

    const slots = await this.prisma.instructorAvailability.findMany({
      where: { instructorId: user.instructorProfile.id },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    return slots.map(({ dayOfWeek, startTime, endTime }) => ({
      dayOfWeek,
      startTime,
      endTime,
    }));
  }

  async setAvailability(
    schoolId: string,
    userId: string,
    dto: SetInstructorAvailabilityDto,
  ): Promise<InstructorAvailabilityDto[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, schoolId },
      select: {
        instructorProfile: {
          select: { id: true },
        },
      },
    });

    if (!user?.instructorProfile) {
      throw new NotFoundException("Instructor not found");
    }

    const instructorId = user.instructorProfile.id;

    this.validateSlots(dto.slots);

    await this.prisma.$transaction([
      this.prisma.instructorAvailability.deleteMany({
        where: { instructorId },
      }),
      ...dto.slots.map((slot) =>
        this.prisma.instructorAvailability.create({
          data: {
            instructorId,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
          },
        }),
      ),
    ]);

    return this.getAvailability(schoolId, userId);
  }

  private validateSlots(slots: InstructorAvailabilityDto[]): void {
    for (const slot of slots) {
      if (slot.startTime >= slot.endTime) {
        throw new BadRequestException(
          `Start time must be before end time (day ${slot.dayOfWeek}: ${slot.startTime}-${slot.endTime})`,
        );
      }
    }

    const byDay = new Map<number, InstructorAvailabilityDto[]>();
    for (const slot of slots) {
      const day = byDay.get(slot.dayOfWeek) ?? [];
      day.push(slot);
      byDay.set(slot.dayOfWeek, day);
    }

    for (const [day, daySlots] of byDay) {
      const sorted = daySlots.toSorted((a, b) =>
        a.startTime.localeCompare(b.startTime),
      );
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].startTime < sorted[i - 1].endTime) {
          throw new BadRequestException(
            `Overlapping availability on day ${day}: ${sorted[i - 1].startTime}-${sorted[i - 1].endTime} and ${sorted[i].startTime}-${sorted[i].endTime}`,
          );
        }
      }
    }
  }
}
