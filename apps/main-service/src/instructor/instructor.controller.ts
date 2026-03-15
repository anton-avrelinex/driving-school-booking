import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { Role } from "../generated/prisma/enums";
import type { AuthenticatedRequest } from "../auth/authenticated-request.interface";
import { InstructorService } from "./instructor.service";
import { CreateInstructorDto } from "./dto/create-instructor.dto";
import { UpdateInstructorDto } from "./dto/update-instructor.dto";

@Controller("users/instructors")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class InstructorController {
  constructor(private readonly instructorService: InstructorService) {}

  @Post()
  create(
    @Body() dto: CreateInstructorDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.instructorService.create(req.user.schoolId, dto);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateInstructorDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.instructorService.update(req.user.schoolId, id, dto);
  }
}
