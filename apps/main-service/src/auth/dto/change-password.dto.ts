import { IsNotEmpty, IsString, MinLength } from "class-validator";
import type {
  ChangePasswordDto as SharedChangePasswordDto,
  AssertTrue,
  TypesAreEqual,
} from "@driving-school-booking/shared-types";

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;
}

type _assert = AssertTrue<
  TypesAreEqual<ChangePasswordDto, SharedChangePasswordDto>
>;
