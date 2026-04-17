import {
  Controller,
  Get,
  Query,
  ServiceUnavailableException,
  UseGuards,
} from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";
import {
  JwtAuthGuard,
  RolesGuard,
  Roles,
} from "@driving-school-booking/nestjs-auth";
import { ROLES } from "@driving-school-booking/shared-types";
import { HealthSummaryService } from "./health-summary.service";
import { HealthSummaryFiltersDto } from "./dto/health-summary-filters.dto";

@Controller("health")
export class HealthController {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly healthSummaryService: HealthSummaryService,
  ) {}

  @Get()
  async check() {
    try {
      const db = this.connection.db;
      if (!db) {
        throw new Error("Database not initialized");
      }

      await db.admin().ping({ timeoutMS: 500 });
      return { status: "ok", db: "connected" };
    } catch {
      throw new ServiceUnavailableException({
        status: "degraded",
        db: "disconnected",
      });
    }
  }

  @Get("summary")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.ADMIN)
  getSummary(@Query() filters: HealthSummaryFiltersDto) {
    return this.healthSummaryService.getSummaries(filters);
  }

  @Get("checks")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.ADMIN)
  getChecks(@Query() filters: HealthSummaryFiltersDto) {
    return this.healthSummaryService.getChecks(filters);
  }
}
