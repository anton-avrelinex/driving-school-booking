import { IsIn, IsOptional } from "class-validator";
import { ROLES, type Role } from "@driving-school-booking/shared-types";

export class ListUsersQueryDto {
  @IsOptional()
  @IsIn(Object.values(ROLES))
  role?: Role;
}
