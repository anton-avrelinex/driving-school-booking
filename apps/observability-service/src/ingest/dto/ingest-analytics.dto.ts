import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import {
  SERVICES,
  type Service,
  type IngestAnalyticsItem,
  type IngestAnalyticsBody,
  AssertTrue,
  TypesAreEqual,
} from "@driving-school-booking/shared-types";

export class AnalyticsEventItemDto {
  @IsString()
  event!: string;

  @IsIn(Object.values(SERVICES))
  service!: Service;

  @IsString()
  timestamp!: string;

  @IsOptional()
  properties?: Record<string, unknown> | null;

  @IsOptional()
  @IsString()
  sessionId?: string | null;
}

export class IngestAnalyticsDto {
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => AnalyticsEventItemDto)
  events!: AnalyticsEventItemDto[];
}

type _assertItem = AssertTrue<
  TypesAreEqual<AnalyticsEventItemDto, IngestAnalyticsItem>
>;
type _assertBody = AssertTrue<
  TypesAreEqual<IngestAnalyticsDto, IngestAnalyticsBody>
>;
