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
import { VehicleService } from "./vehicle.service";
import { CreateVehicleDto } from "./dto/create-vehicle.dto";
import { UpdateVehicleDto } from "./dto/update-vehicle.dto";

@Controller("vehicles")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Post()
  create(@Body() dto: CreateVehicleDto, @Request() req: AuthenticatedRequest) {
    return this.vehicleService.create(req.user.schoolId, dto);
  }

  @Get()
  findAll(@Request() req: AuthenticatedRequest) {
    return this.vehicleService.findAll(req.user.schoolId);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateVehicleDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.vehicleService.update(req.user.schoolId, id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Request() req: AuthenticatedRequest) {
    return this.vehicleService.remove(req.user.schoolId, id);
  }
}
