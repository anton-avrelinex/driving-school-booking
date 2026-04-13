import { IsDateString, IsOptional, IsString } from "class-validator";
import type {
  MonitoringFilters as SharedMonitoringFilters,
  AssertTrue,
  TypesAreEqual,
} from "@driving-school-booking/shared-types";

export class MonitoringFiltersDto {
  @IsDateString()
  from!: string;

  @IsDateString()
  to!: string;

  @IsOptional()
  @IsString()
  schoolId?: string;

  @IsOptional()
  @IsString()
  userId?: string;
}

type _assert = AssertTrue<
  TypesAreEqual<MonitoringFiltersDto, SharedMonitoringFilters>
>;
