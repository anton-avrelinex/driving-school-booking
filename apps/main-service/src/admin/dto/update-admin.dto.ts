import { PartialType } from "@nestjs/mapped-types";
import {
  type UpdateAdminDto as SharedUpdateAdminDto,
  type AssertTrue,
  type TypesAreEqual,
} from "@driving-school-booking/shared-types";
import { CreateAdminDto } from "./create-admin.dto";

export class UpdateAdminDto extends PartialType(CreateAdminDto) {}

type _assert = AssertTrue<TypesAreEqual<UpdateAdminDto, SharedUpdateAdminDto>>;
