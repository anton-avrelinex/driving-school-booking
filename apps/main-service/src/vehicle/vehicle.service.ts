import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { VehicleDto } from "@driving-school-booking/shared-types";
import { PrismaService } from "../prisma/prisma.service";
import { CreateVehicleDto } from "./dto/create-vehicle.dto";
import { UpdateVehicleDto } from "./dto/update-vehicle.dto";
import { Prisma } from "../generated/prisma/client";

const VEHICLE_SELECT = {
  id: true,
  make: true,
  model: true,
  licensePlate: true,
  transmission: true,
  categoryId: true,
} as Prisma.VehicleSelect;

@Injectable()
export class VehicleService {
  constructor(private readonly prisma: PrismaService) {}

  async create(schoolId: string, dto: CreateVehicleDto): Promise<VehicleDto> {
    const existing = await this.prisma.vehicle.findUnique({
      where: {
        schoolId_licensePlate: { schoolId, licensePlate: dto.licensePlate },
      },
    });

    if (existing) {
      throw new ConflictException(
        "A vehicle with this license plate already exists",
      );
    }

    const vehicle = await this.prisma.vehicle.create({
      data: { schoolId, ...dto },
      select: VEHICLE_SELECT,
    });

    return vehicle;
  }

  async findAll(schoolId: string): Promise<VehicleDto[]> {
    return this.prisma.vehicle.findMany({
      where: { schoolId },
      select: VEHICLE_SELECT,
      orderBy: { make: "asc" },
    });
  }

  async update(
    schoolId: string,
    id: string,
    dto: UpdateVehicleDto,
  ): Promise<VehicleDto> {
    const existing = await this.prisma.vehicle.findUnique({
      where: { id, schoolId },
    });

    if (!existing) {
      throw new NotFoundException("Vehicle not found");
    }

    if (dto.licensePlate && dto.licensePlate !== existing.licensePlate) {
      const duplicate = await this.prisma.vehicle.findUnique({
        where: {
          schoolId_licensePlate: {
            schoolId,
            licensePlate: dto.licensePlate,
          },
        },
      });
      if (duplicate) {
        throw new ConflictException(
          "A vehicle with this license plate already exists",
        );
      }
    }

    return this.prisma.vehicle.update({
      where: { id },
      data: dto,
      select: VEHICLE_SELECT,
    });
  }

  async remove(schoolId: string, id: string): Promise<void> {
    const existing = await this.prisma.vehicle.findUnique({
      where: { id, schoolId },
      include: { _count: { select: { instructors: true } } },
    });

    if (!existing) {
      throw new NotFoundException("Vehicle not found");
    }

    if (existing._count.instructors > 0) {
      throw new ConflictException(
        "Cannot delete vehicle with assigned instructors",
      );
    }

    await this.prisma.vehicle.delete({ where: { id } });
  }
}
