import type { ZonedDateTime } from "@internationalized/date";
import type {
  EventCountTimeSeriesDto,
  PageLoadTimeSeriesDto,
  PageViewTimeSeriesDto,
} from "@driving-school-booking/shared-types";
import { parseISOToZoned } from "@/lib/date-utils";

export interface EventCountTimeSeriesModel {
  bucket: ZonedDateTime;
  event: string;
  count: number;
}

export interface PageViewTimeSeriesModel {
  bucket: ZonedDateTime;
  route: string;
  count: number;
}

export interface PageLoadTimeSeriesModel {
  bucket: ZonedDateTime;
  route: string;
  avgLoadTimeMs: number;
}

export function toEventCountTimeSeriesModel(
  dto: EventCountTimeSeriesDto,
): EventCountTimeSeriesModel {
  return {
    bucket: parseISOToZoned(dto.bucket),
    event: dto.event,
    count: dto.count,
  };
}

export function toPageViewTimeSeriesModel(
  dto: PageViewTimeSeriesDto,
): PageViewTimeSeriesModel {
  return {
    bucket: parseISOToZoned(dto.bucket),
    route: dto.route,
    count: dto.count,
  };
}

export function toPageLoadTimeSeriesModel(
  dto: PageLoadTimeSeriesDto,
): PageLoadTimeSeriesModel {
  return {
    bucket: parseISOToZoned(dto.bucket),
    route: dto.route,
    avgLoadTimeMs: dto.avgLoadTimeMs,
  };
}
