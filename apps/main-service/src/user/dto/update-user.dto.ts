import { PartialType } from "@nestjs/mapped-types";
import { IsIn, IsOptional } from "class-validator";
import {
  USER_STATUSES,
  type UserStatus,
  type UpdateUserDto as SharedUpdateUserDto,
  type AssertTrue,
  type TypesAreEqual,
} from "@driving-school-booking/shared-types";
import { CreateUserDto } from "./create-user.dto";

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsIn(Object.values(USER_STATUSES))
  status?: UserStatus;
}

type _assert = AssertTrue<TypesAreEqual<UpdateUserDto, SharedUpdateUserDto>>;
