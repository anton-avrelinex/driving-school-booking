import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { CourseDto } from "@driving-school-booking/shared-types";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCourseDto } from "./dto/create-course.dto";
import { UpdateCourseDto } from "./dto/update-course.dto";

const COURSE_SELECT = {
  id: true,
  name: true,
  price: true,
  hours: true,
  categoryId: true,
  transmission: true,
} as const;

function toCourseDto(course: {
  id: string;
  name: string;
  price: unknown;
  hours: number;
  categoryId: string;
  transmission: string;
}): CourseDto {
  return {
    id: course.id,
    name: course.name,
    price: Number(course.price),
    hours: course.hours,
    categoryId: course.categoryId,
    transmission: course.transmission as CourseDto["transmission"],
  };
}

@Injectable()
export class CourseService {
  constructor(private readonly prisma: PrismaService) {}

  async create(schoolId: string, dto: CreateCourseDto): Promise<CourseDto> {
    const existing = await this.prisma.course.findUnique({
      where: { schoolId_name: { schoolId, name: dto.name } },
    });

    if (existing) {
      throw new ConflictException("A course with this name already exists");
    }

    const course = await this.prisma.course.create({
      data: { schoolId, ...dto },
      select: COURSE_SELECT,
    });

    return toCourseDto(course);
  }

  async findAll(schoolId: string): Promise<CourseDto[]> {
    const courses = await this.prisma.course.findMany({
      where: { schoolId },
      select: COURSE_SELECT,
      orderBy: { name: "asc" },
    });

    return courses.map(toCourseDto);
  }

  async update(
    schoolId: string,
    id: string,
    dto: UpdateCourseDto,
  ): Promise<CourseDto> {
    const existing = await this.prisma.course.findUnique({
      where: { id, schoolId },
    });

    if (!existing) {
      throw new NotFoundException("Course not found");
    }

    if (dto.name && dto.name !== existing.name) {
      const duplicate = await this.prisma.course.findUnique({
        where: { schoolId_name: { schoolId, name: dto.name } },
      });

      if (duplicate) {
        throw new ConflictException("A course with this name already exists");
      }
    }

    const course = await this.prisma.course.update({
      where: { id },
      data: dto,
      select: COURSE_SELECT,
    });

    return toCourseDto(course);
  }

  async remove(schoolId: string, id: string): Promise<void> {
    const existing = await this.prisma.course.findUnique({
      where: { id, schoolId },
      include: { _count: { select: { instructors: true } } },
    });

    if (!existing) {
      throw new NotFoundException("Course not found");
    }

    if (existing._count.instructors > 0) {
      throw new ConflictException(
        "Cannot delete course with assigned instructors",
      );
    }

    await this.prisma.course.delete({ where: { id } });
  }
}
