import { IsDateString, IsUUID } from "class-validator";
import {
  type CreateLessonDto as SharedCreateLessonDto,
  type AssertTrue,
  type TypesAreEqual,
} from "@driving-school-booking/shared-types";

export class CreateLessonDto {
  @IsUUID()
  enrollmentId!: string;

  @IsUUID()
  instructorId!: string;

  @IsDateString()
  startTime!: string;
}

type _assert = AssertTrue<
  TypesAreEqual<CreateLessonDto, SharedCreateLessonDto>
>;
