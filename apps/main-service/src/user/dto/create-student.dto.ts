import { IsArray, IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from "class-validator";
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
  @MinLength(1)
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  lastName!: string;

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  enrollmentCourseIds?: string[];
}

type _assert = AssertTrue<TypesAreEqual<CreateStudentDto, SharedCreateStudentDto>>;
