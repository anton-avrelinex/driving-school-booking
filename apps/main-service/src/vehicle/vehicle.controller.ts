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
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { Role } from "../generated/prisma/enums";
import type { AuthenticatedRequest } from "../auth/authenticated-request.interface";
import { VehicleService } from "./vehicle.service";
import { CreateVehicleDto } from "./dto/create-vehicle.dto";
import { UpdateVehicleDto } from "./dto/update-vehicle.dto";

@Controller("vehicles")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Post()
  create(
    @Body() dto: CreateVehicleDto,
    @Request() req: AuthenticatedRequest,
  ) {
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
