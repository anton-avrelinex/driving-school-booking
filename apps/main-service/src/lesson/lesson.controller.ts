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
import {
  JwtAuthGuard,
  RolesGuard,
  Roles,
  type AuthenticatedRequest,
} from "@driving-school-booking/nestjs-auth";
import { Role } from "../generated/prisma/enums";
import { LessonAvailabilityService } from "./lesson-availability.service";
import { LessonLifecycleService } from "./lesson-lifecycle.service";
import { CreateLessonDto } from "./dto/create-lesson.dto";
import { AssignVehicleDto } from "./dto/assign-vehicle.dto";

@Controller("lessons")
@UseGuards(JwtAuthGuard, RolesGuard)
export class LessonController {
  constructor(
    private readonly availability: LessonAvailabilityService,
    private readonly lifecycle: LessonLifecycleService,
  ) {}

  @Get("available-instructors")
  @Roles(Role.STUDENT)
  async getAvailableInstructors(
    @Query("enrollmentId") enrollmentId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const studentProfileId = await this.availability.getStudentProfileId(
      req.user.sub,
    );
    return this.availability.getAvailableInstructors(
      req.user.schoolId,
      enrollmentId,
      studentProfileId,
    );
  }

  @Get("availability/slots")
  @Roles(Role.STUDENT)
  async getSlots(
    @Query("enrollmentId") enrollmentId: string,
    @Query("from") from: string,
    @Query("to") to: string,
    @Query("instructorId") instructorId: string | undefined,
    @Request() req: AuthenticatedRequest,
  ) {
    const studentProfileId = await this.availability.getStudentProfileId(
      req.user.sub,
    );
    return this.availability.getSlots(
      req.user.schoolId,
      enrollmentId,
      studentProfileId,
      new Date(from),
      new Date(to),
      instructorId,
    );
  }

  @Post()
  @Roles(Role.STUDENT)
  async create(
    @Body() dto: CreateLessonDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const studentProfileId = await this.availability.getStudentProfileId(
      req.user.sub,
    );
    return this.lifecycle.create(req.user.schoolId, studentProfileId, dto);
  }

  @Get()
  findAll(
    @Query("status") status: string | undefined,
    @Query("from") from: string | undefined,
    @Query("to") to: string | undefined,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.lifecycle.findAll(
      req.user.schoolId,
      req.user.role,
      req.user.sub,
      { status, from, to },
    );
  }

  @Patch(":id/complete")
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  complete(@Param("id") id: string, @Request() req: AuthenticatedRequest) {
    return this.lifecycle.complete(req.user.schoolId, id);
  }

  @Get(":id/available-vehicles")
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  getAvailableVehicles(
    @Param("id") id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.lifecycle.getAvailableVehicles(
      req.user.schoolId,
      id,
      req.user.sub,
      req.user.role,
    );
  }

  @Patch(":id/confirm")
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  confirm(@Param("id") id: string, @Request() req: AuthenticatedRequest) {
    return this.lifecycle.confirm(
      req.user.schoolId,
      id,
      req.user.sub,
      req.user.role,
    );
  }

  @Patch(":id/reject")
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  reject(@Param("id") id: string, @Request() req: AuthenticatedRequest) {
    return this.lifecycle.reject(
      req.user.schoolId,
      id,
      req.user.sub,
      req.user.role,
    );
  }

  @Patch(":id/cancel")
  cancel(@Param("id") id: string, @Request() req: AuthenticatedRequest) {
    return this.lifecycle.cancel(req.user.schoolId, id, req.user.sub);
  }

  @Patch(":id/vehicle")
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  assignVehicle(
    @Param("id") id: string,
    @Body() dto: AssignVehicleDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.lifecycle.assignVehicle(req.user.schoolId, id, dto);
  }
}
