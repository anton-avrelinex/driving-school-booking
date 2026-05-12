import { HttpAdapterHost, NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { PrismaExceptionFilter } from "./common/prisma-exception.filter";
import { RequestLogInterceptor } from "./request-log/request-log.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.use(cookieParser());

  const corsOrigin = process.env.CORS_ORIGIN;
  if (corsOrigin) {
    app.enableCors({
      origin: corsOrigin.split(",").map((s) => s.trim()),
      credentials: true,
    });
  }

  app.setGlobalPrefix("api");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(
    new PrismaExceptionFilter(app.get(HttpAdapterHost).httpAdapter),
  );
  app.useGlobalInterceptors(app.get(RequestLogInterceptor));

  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
