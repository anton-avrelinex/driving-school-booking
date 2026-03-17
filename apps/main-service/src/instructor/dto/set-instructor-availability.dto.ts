import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsMilitaryTime,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import {
  type InstructorAvailabilityDto as SharedInstructorAvailabilityDto,
  type SetInstructorAvailabilityDto as SharedSetInstructorAvailabilityDto,
  type AssertTrue,
  type TypesAreEqual,
} from "@driving-school-booking/shared-types";

export class InstructorAvailabilityDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @IsMilitaryTime()
  startTime!: string;

  @IsMilitaryTime()
  endTime!: string;
}

export class SetInstructorAvailabilityDto {
  @IsArray()
  @ArrayMaxSize(21)
  @ValidateNested({ each: true })
  @Type(() => InstructorAvailabilityDto)
  slots!: InstructorAvailabilityDto[];
}

type _assertSlot = AssertTrue<
  TypesAreEqual<InstructorAvailabilityDto, SharedInstructorAvailabilityDto>
>;
type _assertSet = AssertTrue<
  TypesAreEqual<
    SetInstructorAvailabilityDto,
    SharedSetInstructorAvailabilityDto
  >
>;
