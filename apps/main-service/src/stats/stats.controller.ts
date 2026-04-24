import { Controller, Get, Request, UseGuards } from "@nestjs/common";
import {
  JwtAuthGuard,
  RolesGuard,
  Roles,
  type AuthenticatedRequest,
} from "@driving-school-booking/nestjs-auth";
import { Role } from "../generated/prisma/enums";
import { StatsService } from "./stats.service";

@Controller("stats")
@UseGuards(JwtAuthGuard, RolesGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get("admin-dashboard")
  @Roles(Role.ADMIN)
  getAdminDashboard(@Request() req: AuthenticatedRequest) {
    return this.statsService.getAdminDashboardStats(req.user.schoolId);
  }
}
