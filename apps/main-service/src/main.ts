import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { RequestLogInterceptor } from "./request-log/request-log.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("api");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(app.get(RequestLogInterceptor));

  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
