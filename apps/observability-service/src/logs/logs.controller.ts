import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  JwtAuthGuard,
  RolesGuard,
  Roles,
} from "@driving-school-booking/nestjs-auth";
import { ROLES } from "@driving-school-booking/shared-types";
import type {
  TopEndpointDto,
  RequestsBySchoolDto,
  VolumePointDto,
  ErrorRatePointDto,
  LatencyPointDto,
  LogSearchResultDto,
} from "@driving-school-booking/shared-types";
import { LogsService } from "./logs.service";
import { MonitoringFiltersDto } from "./dto/monitoring-filters.dto";
import { TimeSeriesFiltersDto } from "./dto/time-series-filters.dto";
import { TopEndpointsFiltersDto } from "./dto/top-endpoints-filters.dto";
import { LogSearchFiltersDto } from "./dto/log-search-filters.dto";

@Controller("logs")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLES.ADMIN)
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get("search")
  search(@Query() filters: LogSearchFiltersDto): Promise<LogSearchResultDto> {
    return this.logsService.search(filters);
  }

  @Get("top-endpoints")
  getTopEndpoints(
    @Query() filters: TopEndpointsFiltersDto,
  ): Promise<TopEndpointDto[]> {
    return this.logsService.getTopEndpoints(filters, filters.limit);
  }

  @Get("by-school")
  getBySchool(
    @Query() filters: MonitoringFiltersDto,
  ): Promise<RequestsBySchoolDto[]> {
    return this.logsService.getBySchool(filters);
  }

  @Get("volume")
  getVolume(@Query() filters: TimeSeriesFiltersDto): Promise<VolumePointDto[]> {
    return this.logsService.getVolume(filters);
  }

  @Get("error-rate")
  getErrorRate(
    @Query() filters: TimeSeriesFiltersDto,
  ): Promise<ErrorRatePointDto[]> {
    return this.logsService.getErrorRate(filters);
  }

  @Get("latency")
  getLatency(
    @Query() filters: TimeSeriesFiltersDto,
  ): Promise<LatencyPointDto[]> {
    return this.logsService.getLatency(filters);
  }
}
