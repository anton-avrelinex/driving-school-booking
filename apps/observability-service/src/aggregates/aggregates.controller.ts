import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  JwtAuthGuard,
  RolesGuard,
  Roles,
} from "@driving-school-booking/nestjs-auth";
import {
  ROLES,
  type DailyAggregateDto,
} from "@driving-school-booking/shared-types";
import { AggregatesService } from "./aggregates.service";
import { TrendsFiltersDto } from "./dto/trends-filters.dto";

@Controller("aggregates")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLES.ADMIN)
export class AggregatesController {
  constructor(private readonly aggregatesService: AggregatesService) {}

  @Get("trends")
  getTrends(@Query() filters: TrendsFiltersDto): Promise<DailyAggregateDto[]> {
    return this.aggregatesService.getTrends(filters);
  }
}
