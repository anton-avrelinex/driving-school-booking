import {
  IsISO4217CurrencyCode,
  IsInt,
  IsMilitaryTime,
  IsNumber,
  IsOptional,
  IsTimeZone,
  Max,
  Min,
} from "class-validator";
import {
  type UpdateSchoolConfigDto as SharedUpdateSchoolConfigDto,
  type AssertTrue,
  type TypesAreEqual,
} from "@driving-school-booking/shared-types";

export class UpdateSchoolConfigDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(30)
  cancelDeadlineDaysBefore?: number;

  @IsOptional()
  @IsMilitaryTime()
  cancelDeadlineTime?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  lateCancelPenaltyPerHour?: number;

  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(480)
  defaultLessonDurationMin?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(168)
  minBookingLeadHours?: number;

  @IsOptional()
  @IsTimeZone()
  timezone?: string;

  @IsOptional()
  @IsISO4217CurrencyCode()
  currency?: string;
}

type _assert = AssertTrue<
  TypesAreEqual<UpdateSchoolConfigDto, SharedUpdateSchoolConfigDto>
>;
