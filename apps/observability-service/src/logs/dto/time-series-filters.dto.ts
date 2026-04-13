import { IsIn, IsOptional } from "class-validator";
import {
  GRANULARITIES,
  type Granularity,
  type TimeSeriesFilters as SharedTimeSeriesFilters,
  type AssertTrue,
  type TypesAreEqual,
} from "@driving-school-booking/shared-types";
import { MonitoringFiltersDto } from "./monitoring-filters.dto";

export class TimeSeriesFiltersDto extends MonitoringFiltersDto {
  @IsOptional()
  @IsIn(Object.values(GRANULARITIES))
  granularity?: Granularity;
}

type _assert = AssertTrue<
  TypesAreEqual<TimeSeriesFiltersDto, SharedTimeSeriesFilters>
>;
