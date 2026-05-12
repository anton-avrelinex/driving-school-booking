import {
  ArgumentsHost,
  Catch,
  ConflictException,
  type ExceptionFilter,
  HttpException,
  Logger,
} from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import { Prisma } from "../generated/prisma/client";

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter
  extends BaseExceptionFilter
  implements ExceptionFilter
{
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(
    exception: Prisma.PrismaClientKnownRequestError,
    host: ArgumentsHost,
  ): void {
    if (exception.code === "P2002") {
      const target = (exception.meta?.target as string[] | undefined)?.join(
        ", ",
      );
      const message = target
        ? `A resource with these values already exists (${target})`
        : "A resource with these values already exists";
      super.catch(new ConflictException(message), host);
      return;
    }
    this.logger.warn(`Unhandled Prisma error ${exception.code}`, exception);
    super.catch(
      new HttpException({ statusCode: 500, message: "Database error" }, 500),
      host,
    );
  }
}
