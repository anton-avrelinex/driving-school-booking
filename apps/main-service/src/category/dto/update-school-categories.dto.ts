import { IsArray, IsUUID } from "class-validator";
import {
  type UpdateSchoolCategoriesDto as SharedUpdateSchoolCategoriesDto,
  type AssertTrue,
  type TypesAreEqual,
} from "@driving-school-booking/shared-types";

export class UpdateSchoolCategoriesDto {
  @IsArray()
  @IsUUID("4", { each: true })
  categoryIds!: string[];
}

type _assert = AssertTrue<
  TypesAreEqual<UpdateSchoolCategoriesDto, SharedUpdateSchoolCategoriesDto>
>;
