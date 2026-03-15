import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { Role } from "../generated/prisma/enums";
import type { AuthenticatedRequest } from "../auth/authenticated-request.interface";
import { AdminService } from "./admin.service";
import { CreateAdminDto } from "./dto/create-admin.dto";
import { UpdateAdminDto } from "./dto/update-admin.dto";

@Controller("users/admins")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  create(@Body() dto: CreateAdminDto, @Request() req: AuthenticatedRequest) {
    return this.adminService.create(req.user.schoolId, dto);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateAdminDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.adminService.update(req.user.schoolId, id, dto);
  }
}
