import {
  Body,
  Controller,
  Get,
  Patch,
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
import { SchoolConfigService } from "./school-config.service";
import { UpdateSchoolConfigDto } from "./dto/update-school-config.dto";

@Controller("school-config")
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchoolConfigController {
  constructor(private readonly schoolConfigService: SchoolConfigService) {}

  @Get()
  get(@Request() req: AuthenticatedRequest) {
    return this.schoolConfigService.get(req.user.schoolId);
  }

  @Patch()
  @Roles(Role.ADMIN)
  update(
    @Body() dto: UpdateSchoolConfigDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.schoolConfigService.update(req.user.schoolId, dto);
  }
}
