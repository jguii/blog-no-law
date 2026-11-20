import { Module, type DynamicModule } from '@nestjs/common';
import { APP_ENV, type AppEnv } from './config/env.js';
import { StatusController } from './status/status.controller.js';
import {
  DATABASE_PROBE,
  StatusService,
  UnconfiguredDatabaseProbe,
} from './status/status.service.js';

@Module({})
export class AppModule {
  static forRoot(env: AppEnv): DynamicModule {
    return {
      module: AppModule,
      controllers: [StatusController],
      providers: [
        { provide: APP_ENV, useValue: env },
        StatusService,
        { provide: DATABASE_PROBE, useClass: UnconfiguredDatabaseProbe },
      ],
    };
  }
}
