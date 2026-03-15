import { IsIn, IsNotEmpty, IsString, IsUUID } from "class-validator";
import {
  TRANSMISSIONS,
  type Transmission,
  type CreateVehicleDto as SharedCreateVehicleDto,
  type AssertTrue,
  type TypesAreEqual,
} from "@driving-school-booking/shared-types";

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  make!: string;

  @IsString()
  @IsNotEmpty()
  model!: string;

  @IsString()
  @IsNotEmpty()
  licensePlate!: string;

  @IsIn(Object.values(TRANSMISSIONS))
  transmission!: Transmission;

  @IsUUID("4")
  categoryId!: string;
}

type _assert = AssertTrue<
  TypesAreEqual<CreateVehicleDto, SharedCreateVehicleDto>
>;
