import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";
import {
  type UpdateStudentDto as SharedUpdateStudentDto,
  type AssertTrue,
  type TypesAreEqual,
} from "@driving-school-booking/shared-types";

export class UpdateStudentDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  firstName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  lastName?: string;
}

type _assert = AssertTrue<
  TypesAreEqual<UpdateStudentDto, SharedUpdateStudentDto>
>;
