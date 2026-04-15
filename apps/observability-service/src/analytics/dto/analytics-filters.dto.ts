import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { Type } from "class-transformer";
import type {
  AnalyticsFilters as SharedAnalyticsFilters,
  AssertTrue,
  TypesAreEqual,
} from "@driving-school-booking/shared-types";
import { MonitoringFiltersDto } from "../../logs/dto/monitoring-filters.dto";

export class AnalyticsFiltersDto extends MonitoringFiltersDto {
  @IsOptional()
  @IsString()
  event?: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 50;
}

type _assert = AssertTrue<
  TypesAreEqual<AnalyticsFiltersDto, SharedAnalyticsFilters>
>;
