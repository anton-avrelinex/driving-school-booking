import { IsIn, IsInt, IsNotEmpty, IsNumber, IsString, IsUUID, Min } from "class-validator";
import {
  TRANSMISSIONS,
  type Transmission,
  type CreateCourseDto as SharedCreateCourseDto,
  type AssertTrue,
  type TypesAreEqual,
} from "@driving-school-booking/shared-types";

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @IsInt()
  @Min(1)
  hours!: number;

  @IsUUID("4")
  categoryId!: string;

  @IsIn(Object.values(TRANSMISSIONS))
  transmission!: Transmission;
}

type _assert = AssertTrue<TypesAreEqual<CreateCourseDto, SharedCreateCourseDto>>;
