import { IsNotEmpty, IsString } from "class-validator";
import type {
  RefreshDto as SharedRefreshDto,
  AssertTrue,
  TypesAreEqual,
} from "@driving-school-booking/shared-types";

export class RefreshDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

type _assert = AssertTrue<TypesAreEqual<RefreshDto, SharedRefreshDto>>;
