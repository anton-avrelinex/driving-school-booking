import { IsArray, IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from "class-validator";
import {
  type CreateInstructorDto as SharedCreateInstructorDto,
  type AssertTrue,
  type TypesAreEqual,
} from "@driving-school-booking/shared-types";

export class CreateInstructorDto {
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
  courseIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  vehicleIds?: string[];
}

type _assert = AssertTrue<TypesAreEqual<CreateInstructorDto, SharedCreateInstructorDto>>;
