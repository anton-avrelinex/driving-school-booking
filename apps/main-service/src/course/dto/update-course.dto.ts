import { PartialType } from "@nestjs/mapped-types";
import {
  type UpdateCourseDto as SharedUpdateCourseDto,
  type AssertTrue,
  type TypesAreEqual,
} from "@driving-school-booking/shared-types";
import { CreateCourseDto } from "./create-course.dto";

export class UpdateCourseDto extends PartialType(CreateCourseDto) {}

type _assert = AssertTrue<
  TypesAreEqual<UpdateCourseDto, SharedUpdateCourseDto>
>;
