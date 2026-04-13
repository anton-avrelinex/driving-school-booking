import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
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
import { InstructorService } from "./instructor.service";
import { CreateInstructorDto } from "./dto/create-instructor.dto";
import { SetInstructorAvailabilityDto } from "./dto/set-instructor-availability.dto";
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

  @Get(":id/availability")
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  getAvailability(
    @Param("id") id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.instructorService.getAvailability(req.user.schoolId, id);
  }

  @Put(":id/availability")
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  setAvailability(
    @Param("id") id: string,
    @Body() dto: SetInstructorAvailabilityDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.instructorService.setAvailability(req.user.schoolId, id, dto);
  }
}
