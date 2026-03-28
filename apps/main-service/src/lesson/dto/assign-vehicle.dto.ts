import { IsUUID } from "class-validator";
import {
  type AssignVehicleDto as SharedAssignVehicleDto,
  type AssertTrue,
  type TypesAreEqual,
} from "@driving-school-booking/shared-types";

export class AssignVehicleDto {
  @IsUUID()
  vehicleId!: string;
}

type _assert = AssertTrue<
  TypesAreEqual<AssignVehicleDto, SharedAssignVehicleDto>
>;
