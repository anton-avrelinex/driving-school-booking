import type { ZonedDateTime } from "@internationalized/date";
import type {
  ErrorRatePointDto,
  LatencyPointDto,
  VolumePointDto,
} from "@driving-school-booking/shared-types";
import { parseISOToZoned } from "@/lib/date-utils";

export interface VolumePointModel {
  bucket: ZonedDateTime;
  count: number;
}

export interface ErrorRatePointModel {
  bucket: ZonedDateTime;
  total: number;
  errors: number;
  rate: number;
}

export interface LatencyPointModel {
  bucket: ZonedDateTime;
  p50: number;
  p95: number;
  p99: number;
}

export function toVolumePointModel(dto: VolumePointDto): VolumePointModel {
  return { bucket: parseISOToZoned(dto.bucket), count: dto.count };
}

export function toErrorRatePointModel(
  dto: ErrorRatePointDto,
): ErrorRatePointModel {
  return {
    bucket: parseISOToZoned(dto.bucket),
    total: dto.total,
    errors: dto.errors,
    rate: dto.rate,
  };
}

export function toLatencyPointModel(dto: LatencyPointDto): LatencyPointModel {
  return {
    bucket: parseISOToZoned(dto.bucket),
    p50: dto.p50,
    p95: dto.p95,
    p99: dto.p99,
  };
}
