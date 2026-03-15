import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator";
import {
  type CreateStudentDto as SharedCreateStudentDto,
  type AssertTrue,
  type TypesAreEqual,
} from "@driving-school-booking/shared-types";

export class CreateStudentDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsOptional()
  @IsUUID("4", { each: true })
  enrollmentCourseIds?: string[];
}

type _assert = AssertTrue<
  TypesAreEqual<CreateStudentDto, SharedCreateStudentDto>
>;
