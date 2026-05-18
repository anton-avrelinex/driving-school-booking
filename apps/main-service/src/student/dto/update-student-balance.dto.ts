import { IsNumber, Min } from "class-validator";
import type {
  AssertTrue,
  TypesAreEqual,
  UpdateStudentBalanceDto as SharedUpdateStudentBalanceDto,
} from "@driving-school-booking/shared-types";

export class UpdateStudentBalanceDto {
  @IsNumber()
  @Min(0)
  outstandingBalance!: number;
}

type _assert = AssertTrue<
  TypesAreEqual<UpdateStudentBalanceDto, SharedUpdateStudentBalanceDto>
>;
