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
  LOG_LEVELS,
  LOG_TYPES,
  SERVICES,
  type LogLevel,
  type Service,
  type IngestAppLogItem,
  type IngestLogsBody,
  AssertTrue,
  TypesAreEqual,
} from "@driving-school-booking/shared-types";

export class AppLogItemDto {
  @IsIn([LOG_TYPES.APP])
  type!: "app";

  @IsIn(Object.values(SERVICES))
  service!: Service;

  @IsString()
  timestamp!: string;

  @IsIn(Object.values(LOG_LEVELS))
  level!: LogLevel;

  @IsString()
  message!: string;

  @IsOptional()
  context?: Record<string, unknown> | null;

  @IsOptional()
  @IsString()
  stack?: string | null;
}

export class IngestLogsDto {
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => AppLogItemDto)
  logs!: AppLogItemDto[];
}

type _assertItem = AssertTrue<TypesAreEqual<AppLogItemDto, IngestAppLogItem>>;
type _assertBody = AssertTrue<TypesAreEqual<IngestLogsDto, IngestLogsBody>>;
