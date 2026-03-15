import { IsEmail, IsNotEmpty, IsString } from "class-validator";
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
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;
}

type _assert = AssertTrue<TypesAreEqual<CreateAdminDto, SharedCreateAdminDto>>;
