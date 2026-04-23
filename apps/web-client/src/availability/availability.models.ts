import type { Time } from "@internationalized/date";
import type { InstructorAvailabilityDto } from "@driving-school-booking/shared-types";
import { parseTimeString, timeToString } from "@/lib/date-utils";

export interface AvailabilityBlockModel {
  dayOfWeek: number;
  startTime: Time;
  endTime: Time;
}

export function toAvailabilityBlockModel(
  dto: InstructorAvailabilityDto,
): AvailabilityBlockModel {
  return {
    dayOfWeek: dto.dayOfWeek,
    startTime: parseTimeString(dto.startTime),
    endTime: parseTimeString(dto.endTime),
  };
}

export function toAvailabilityBlockDto(
  model: AvailabilityBlockModel,
): InstructorAvailabilityDto {
  return {
    dayOfWeek: model.dayOfWeek,
    startTime: timeToString(model.startTime),
    endTime: timeToString(model.endTime),
  };
}
