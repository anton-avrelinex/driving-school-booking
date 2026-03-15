import { PartialType } from "@nestjs/mapped-types";
import {
  type UpdateVehicleDto as SharedUpdateVehicleDto,
  type AssertTrue,
  type TypesAreEqual,
} from "@driving-school-booking/shared-types";
import { CreateVehicleDto } from "./create-vehicle.dto";

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {}

type _assert = AssertTrue<TypesAreEqual<UpdateVehicleDto, SharedUpdateVehicleDto>>;
