import { IsEmail, IsNotEmpty, IsString } from "class-validator";
import type {
  LoginDto as SharedLoginDto,
  AssertTrue,
  TypesAreEqual,
} from "@driving-school-booking/shared-types";

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

type _assert = AssertTrue<TypesAreEqual<LoginDto, SharedLoginDto>>;
