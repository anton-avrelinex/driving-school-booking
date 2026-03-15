import {
  IsArray,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from "class-validator";
import {
  ROLES,
  type Role,
  type CreateUserDto as SharedCreateUserDto,
  type AssertTrue,
  type TypesAreEqual,
} from "@driving-school-booking/shared-types";

export class CreateUserDto {
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

  @IsIn(Object.values(ROLES))
  role!: Role;

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  courseIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  vehicleIds?: string[];
}

type _assert = AssertTrue<TypesAreEqual<CreateUserDto, SharedCreateUserDto>>;
