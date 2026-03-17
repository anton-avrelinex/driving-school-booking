import { Injectable } from "@nestjs/common";
import type { CategoryDto } from "@driving-school-booking/shared-types";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateSchoolCategoriesDto } from "./dto/update-school-categories.dto";
import { Prisma } from "../generated/prisma/client";

const CATEGORY_SELECT = {
  id: true,
  name: true,
} as Prisma.CategorySelect;

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<CategoryDto[]> {
    return this.prisma.category.findMany({
      select: CATEGORY_SELECT,
      orderBy: { name: "asc" },
    });
  }

  async findBySchool(schoolId: string): Promise<CategoryDto[]> {
    const school = await this.prisma.school.findUniqueOrThrow({
      where: { id: schoolId },
      select: {
        categories: { select: CATEGORY_SELECT, orderBy: { name: "asc" } },
      },
    });
    return school.categories;
  }

  async updateSchoolCategories(
    schoolId: string,
    dto: UpdateSchoolCategoriesDto,
  ): Promise<CategoryDto[]> {
    const school = await this.prisma.school.update({
      where: { id: schoolId },
      data: {
        categories: { set: dto.categoryIds.map((id) => ({ id })) },
      },
      select: {
        categories: { select: CATEGORY_SELECT, orderBy: { name: "asc" } },
      },
    });
    return school.categories;
  }
}
