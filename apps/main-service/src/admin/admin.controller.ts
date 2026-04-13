import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import {
  JwtAuthGuard,
  RolesGuard,
  Roles,
  type AuthenticatedRequest,
} from "@driving-school-booking/nestjs-auth";
import { Role } from "../generated/prisma/enums";
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
