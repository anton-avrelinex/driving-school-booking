import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";
import {
  type UpdateProfileDto as SharedUpdateProfileDto,
  type AssertTrue,
  type TypesAreEqual,
} from "@driving-school-booking/shared-types";

export class UpdateProfileDto {
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
  TypesAreEqual<UpdateProfileDto, SharedUpdateProfileDto>
>;
