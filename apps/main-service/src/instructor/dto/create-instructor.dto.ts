import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator";
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
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsOptional()
  @IsUUID("4", { each: true })
  courseIds?: string[];

  @IsOptional()
  @IsUUID("4", { each: true })
  vehicleIds?: string[];
}

type _assert = AssertTrue<
  TypesAreEqual<CreateInstructorDto, SharedCreateInstructorDto>
>;
