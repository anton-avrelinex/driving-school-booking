import { APP_INTERCEPTOR } from "@nestjs/core";
import { DynamicModule, Global, Module } from "@nestjs/common";
import { ObsLoggerService } from "./logger.service";
import { LOGGER_OPTIONS, type LoggerModuleOptions } from "./logger.interfaces";
import { RequestContextInterceptor } from "./request-context.interceptor";

@Global()
@Module({})
export class ObsLoggerModule {
  static forRoot(options: LoggerModuleOptions): DynamicModule {
    return {
      module: ObsLoggerModule,
      providers: [
        { provide: LOGGER_OPTIONS, useValue: options },
        { provide: APP_INTERCEPTOR, useClass: RequestContextInterceptor },
        ObsLoggerService,
      ],
      exports: [ObsLoggerService],
    };
  }
}
