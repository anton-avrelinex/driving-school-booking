import { BadRequestException, Injectable } from "@nestjs/common";
import type { SchoolConfigDto } from "@driving-school-booking/shared-types";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateSchoolConfigDto } from "./dto/update-school-config.dto";

@Injectable()
export class SchoolConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async get(schoolId: string): Promise<SchoolConfigDto> {
    const config = await this.prisma.schoolConfig.upsert({
      where: { schoolId },
      update: {},
      create: { schoolId },
    });
    return toDto(config);
  }

  async update(
    schoolId: string,
    dto: UpdateSchoolConfigDto,
  ): Promise<SchoolConfigDto> {
    if (dto.timezone !== undefined) {
      await assertTimezoneValid(this.prisma, dto.timezone);
    }

    const config = await this.prisma.schoolConfig.upsert({
      where: { schoolId },
      update: dto,
      create: { schoolId, ...dto },
    });
    return toDto(config);
  }
}

function toDto(c: {
  cancelDeadlineDaysBefore: number;
  cancelDeadlineTime: string;
  lateCancelPenaltyPerHour: { toString(): string } | number;
  defaultLessonDurationMin: number;
  inviteExpiryHours: number;
  defaultReminderHours: number;
  timezone: string;
}): SchoolConfigDto {
  return {
    cancelDeadlineDaysBefore: c.cancelDeadlineDaysBefore,
    cancelDeadlineTime: c.cancelDeadlineTime,
    lateCancelPenaltyPerHour: Number(c.lateCancelPenaltyPerHour),
    defaultLessonDurationMin: c.defaultLessonDurationMin,
    inviteExpiryHours: c.inviteExpiryHours,
    defaultReminderHours: c.defaultReminderHours,
    timezone: c.timezone,
  };
}

async function assertTimezoneValid(
  prisma: PrismaService,
  timezone: string,
): Promise<void> {
  // Defer IANA validity to Postgres — same source of truth as the slot SQL.
  try {
    await prisma.$queryRaw`SELECT (now() AT TIME ZONE ${timezone})`;
  } catch {
    throw new BadRequestException(`Unknown timezone: ${timezone}`);
  }
}
