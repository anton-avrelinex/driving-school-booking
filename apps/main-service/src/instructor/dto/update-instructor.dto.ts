import { PartialType } from "@nestjs/mapped-types";
import {
  type UpdateInstructorDto as SharedUpdateInstructorDto,
  type AssertTrue,
  type TypesAreEqual,
} from "@driving-school-booking/shared-types";
import { CreateInstructorDto } from "./create-instructor.dto";

export class UpdateInstructorDto extends PartialType(CreateInstructorDto) {}

type _assert = AssertTrue<
  TypesAreEqual<UpdateInstructorDto, SharedUpdateInstructorDto>
>;
