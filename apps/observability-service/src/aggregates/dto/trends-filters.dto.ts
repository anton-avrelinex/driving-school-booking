import { IsDateString, IsIn, IsOptional } from "class-validator";
import {
  SERVICES,
  type Service,
  type TrendsFilters as SharedTrendsFilters,
  type AssertTrue,
  type TypesAreEqual,
} from "@driving-school-booking/shared-types";

export class TrendsFiltersDto {
  @IsDateString()
  from!: string;

  @IsDateString()
  to!: string;

  @IsOptional()
  @IsIn(Object.values(SERVICES))
  service?: Service;
}

type _assert = AssertTrue<TypesAreEqual<TrendsFiltersDto, SharedTrendsFilters>>;
