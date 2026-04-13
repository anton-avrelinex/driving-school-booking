import { Body, Controller, Get, Put, Request, UseGuards } from "@nestjs/common";
import {
  JwtAuthGuard,
  RolesGuard,
  Roles,
  type AuthenticatedRequest,
} from "@driving-school-booking/nestjs-auth";
import { Role } from "../generated/prisma/enums";
import { CategoryService } from "./category.service";
import { UpdateSchoolCategoriesDto } from "./dto/update-school-categories.dto";

@Controller("categories")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  findAll() {
    return this.categoryService.findAll();
  }

  @Get("school")
  findBySchool(@Request() req: AuthenticatedRequest) {
    return this.categoryService.findBySchool(req.user.schoolId);
  }

  @Put("school")
  updateSchoolCategories(
    @Body() dto: UpdateSchoolCategoriesDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.categoryService.updateSchoolCategories(req.user.schoolId, dto);
  }
}
