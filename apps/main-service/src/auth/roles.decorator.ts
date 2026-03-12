import { SetMetadata } from "@nestjs/common";
import { Role } from "../generated/prisma/client";

export const Roles = (...roles: Role[]) => SetMetadata("roles", roles);
