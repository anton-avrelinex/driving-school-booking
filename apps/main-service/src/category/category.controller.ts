import {
  Body,
  Controller,
  Get,
  Put,
  Request,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { Role } from "../generated/prisma/enums";
import type { AuthenticatedRequest } from "../auth/authenticated-request.interface";
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
    return this.categoryService.updateSchoolCategories(
      req.user.schoolId,
      dto,
    );
  }
}
