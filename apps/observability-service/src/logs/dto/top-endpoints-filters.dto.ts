import { IsInt, IsOptional, Max, Min } from "class-validator";
import { Type } from "class-transformer";
import type {
  TopEndpointsFilters as SharedTopEndpointsFilters,
  AssertTrue,
  TypesAreEqual,
} from "@driving-school-booking/shared-types";
import { MonitoringFiltersDto } from "./monitoring-filters.dto";

export class TopEndpointsFiltersDto extends MonitoringFiltersDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

type _assert = AssertTrue<
  TypesAreEqual<TopEndpointsFiltersDto, SharedTopEndpointsFilters>
>;
