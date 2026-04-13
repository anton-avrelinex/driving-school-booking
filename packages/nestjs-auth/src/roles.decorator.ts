import { SetMetadata } from "@nestjs/common";
import type { Role } from "@driving-school-booking/shared-types";

export const Roles = (...roles: Role[]) => SetMetadata("roles", roles);
