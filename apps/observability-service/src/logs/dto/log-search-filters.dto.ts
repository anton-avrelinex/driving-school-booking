import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { Type } from "class-transformer";
import {
  LOG_TYPES,
  LOG_LEVELS,
  SERVICES,
  type LogType,
  type LogLevel,
  type Service,
  type LogSearchFilters as SharedLogSearchFilters,
  type AssertTrue,
  type TypesAreEqual,
} from "@driving-school-booking/shared-types";
import { MonitoringFiltersDto } from "./monitoring-filters.dto";

export class LogSearchFiltersDto extends MonitoringFiltersDto {
  @IsOptional()
  @IsIn(Object.values(LOG_TYPES))
  type?: LogType;

  @IsOptional()
  @IsIn(Object.values(SERVICES))
  service?: Service;

  @IsOptional()
  @IsIn(Object.values(LOG_LEVELS))
  level?: LogLevel;

  @IsOptional()
  @IsString()
  query?: string;

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
  TypesAreEqual<LogSearchFiltersDto, SharedLogSearchFilters>
>;
