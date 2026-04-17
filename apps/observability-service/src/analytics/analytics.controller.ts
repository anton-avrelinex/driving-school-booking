import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  JwtAuthGuard,
  RolesGuard,
  Roles,
} from "@driving-school-booking/nestjs-auth";
import { ROLES } from "@driving-school-booking/shared-types";
import type {
  AnalyticsEventResultDto,
  EventCountDto,
  EventCountTimeSeriesDto,
  PageViewDto,
  PageViewTimeSeriesDto,
  PageLoadTimeSeriesDto,
  PerformanceDto,
} from "@driving-school-booking/shared-types";
import { AnalyticsService } from "./analytics.service";
import { AnalyticsFiltersDto } from "./dto/analytics-filters.dto";
import { TimeSeriesFiltersDto } from "../logs/dto/time-series-filters.dto";

@Controller("analytics")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLES.ADMIN)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("events")
  getEvents(
    @Query() filters: AnalyticsFiltersDto,
  ): Promise<AnalyticsEventResultDto> {
    return this.analyticsService.getEvents(filters);
  }

  @Get("event-counts")
  getEventCounts(
    @Query() filters: TimeSeriesFiltersDto,
  ): Promise<EventCountDto[]> {
    return this.analyticsService.getEventCounts(filters);
  }

  @Get("page-views")
  getPageViews(@Query() filters: TimeSeriesFiltersDto): Promise<PageViewDto[]> {
    return this.analyticsService.getPageViews(filters);
  }

  @Get("performance")
  getPerformance(
    @Query() filters: TimeSeriesFiltersDto,
  ): Promise<PerformanceDto[]> {
    return this.analyticsService.getPerformance(filters);
  }

  @Get("event-count-series")
  getEventCountSeries(
    @Query() filters: TimeSeriesFiltersDto,
  ): Promise<EventCountTimeSeriesDto[]> {
    return this.analyticsService.getEventCountSeries(filters);
  }

  @Get("page-view-series")
  getPageViewSeries(
    @Query() filters: TimeSeriesFiltersDto,
  ): Promise<PageViewTimeSeriesDto[]> {
    return this.analyticsService.getPageViewSeries(filters);
  }

  @Get("page-load-series")
  getPageLoadSeries(
    @Query() filters: TimeSeriesFiltersDto,
  ): Promise<PageLoadTimeSeriesDto[]> {
    return this.analyticsService.getPageLoadSeries(filters);
  }
}
