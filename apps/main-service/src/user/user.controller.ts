import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { UserService } from "./user.service";
import { CreateStudentDto } from "./dto/create-student.dto";
import { CreateInstructorDto } from "./dto/create-instructor.dto";
import { CreateAdminDto } from "./dto/create-admin.dto";
import { UpdateStudentDto } from "./dto/update-student.dto";
import { UpdateInstructorDto } from "./dto/update-instructor.dto";
import { UpdateAdminDto } from "./dto/update-admin.dto";
import { ListUsersQueryDto } from "./dto/list-users-query.dto";
import { Role } from "../generated/prisma/enums";
import type { AuthenticatedRequest } from "../auth/authenticated-request.interface";

@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post("students")
  createStudent(
    @Body() dto: CreateStudentDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.userService.createStudent(req.user.schoolId, dto);
  }

  @Post("instructors")
  createInstructor(
    @Body() dto: CreateInstructorDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.userService.createInstructor(req.user.schoolId, dto);
  }

  @Post("admins")
  createAdmin(
    @Body() dto: CreateAdminDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.userService.createAdmin(req.user.schoolId, dto);
  }

  @Get()
  findAll(
    @Query() query: ListUsersQueryDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.userService.findAll(req.user.schoolId, query);
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Request() req: AuthenticatedRequest) {
    return this.userService.findOne(req.user.schoolId, id);
  }

  @Patch("students/:id")
  updateStudent(
    @Param("id") id: string,
    @Body() dto: UpdateStudentDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.userService.updateStudent(req.user.schoolId, id, dto);
  }

  @Patch("instructors/:id")
  updateInstructor(
    @Param("id") id: string,
    @Body() dto: UpdateInstructorDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.userService.updateInstructor(req.user.schoolId, id, dto);
  }

  @Patch("admins/:id")
  updateAdmin(
    @Param("id") id: string,
    @Body() dto: UpdateAdminDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.userService.updateAdmin(req.user.schoolId, id, dto);
  }

  @Patch(":id/deactivate")
  deactivate(@Param("id") id: string, @Request() req: AuthenticatedRequest) {
    return this.userService.deactivate(req.user.schoolId, id);
  }
}
