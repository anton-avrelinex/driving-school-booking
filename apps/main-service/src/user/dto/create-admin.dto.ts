import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";
import {
  type CreateAdminDto as SharedCreateAdminDto,
  type AssertTrue,
  type TypesAreEqual,
} from "@driving-school-booking/shared-types";

export class CreateAdminDto {
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
}

type _assert = AssertTrue<TypesAreEqual<CreateAdminDto, SharedCreateAdminDto>>;
