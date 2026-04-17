import { IsDateString, IsIn, IsOptional } from "class-validator";
import {
  HEALTH_COMPONENTS,
  type HealthComponent,
  type HealthSummaryFilters as SharedHealthSummaryFilters,
  type AssertTrue,
  type TypesAreEqual,
} from "@driving-school-booking/shared-types";

export class HealthSummaryFiltersDto {
  @IsDateString()
  from!: string;

  @IsDateString()
  to!: string;

  @IsOptional()
  @IsIn(Object.values(HEALTH_COMPONENTS))
  component?: HealthComponent;
}

type _assert = AssertTrue<
  TypesAreEqual<HealthSummaryFiltersDto, SharedHealthSummaryFilters>
>;
