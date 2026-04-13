import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import {
  JwtAuthGuard,
  RolesGuard,
  Roles,
  type AuthenticatedRequest,
} from "@driving-school-booking/nestjs-auth";
import { Role } from "../generated/prisma/enums";
import { CourseService } from "./course.service";
import { CreateCourseDto } from "./dto/create-course.dto";
import { UpdateCourseDto } from "./dto/update-course.dto";

@Controller("courses")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  create(@Body() dto: CreateCourseDto, @Request() req: AuthenticatedRequest) {
    return this.courseService.create(req.user.schoolId, dto);
  }

  @Get()
  findAll(@Request() req: AuthenticatedRequest) {
    return this.courseService.findAll(req.user.schoolId);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateCourseDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.courseService.update(req.user.schoolId, id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Request() req: AuthenticatedRequest) {
    return this.courseService.remove(req.user.schoolId, id);
  }
}
