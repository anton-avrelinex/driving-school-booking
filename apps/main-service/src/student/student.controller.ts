import {
  Body,
  Controller,
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
import { StudentService } from "./student.service";
import { CreateStudentDto } from "./dto/create-student.dto";
import { UpdateStudentDto } from "./dto/update-student.dto";

@Controller("users/students")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  create(@Body() dto: CreateStudentDto, @Request() req: AuthenticatedRequest) {
    return this.studentService.create(req.user.schoolId, dto);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateStudentDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.studentService.update(req.user.schoolId, id, dto);
  }
}
