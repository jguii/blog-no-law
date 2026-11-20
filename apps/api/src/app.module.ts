import { Module, type DynamicModule, type Provider } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { APP_ENV, type AppEnv } from './config/env.js';
import { DatabaseHealthIndicator } from './health/database.indicator.js';
import { HealthController } from './health/health.controller.js';
import { PrismaDatabaseProbe } from './prisma/prisma-database.probe.js';
import { PrismaService } from './prisma/prisma.service.js';
import { StatusController } from './status/status.controller.js';
import {
  DATABASE_PROBE,
  StatusService,
  UnconfiguredDatabaseProbe,
} from './status/status.service.js';

@Module({})
export class AppModule {
  static forRoot(env: AppEnv): DynamicModule {
    // Com DATABASE_URL, o banco real (como `app_api`); sem ela, o probe 'down' permanente.
    const databaseProviders: Provider[] =
      env.DATABASE_URL === undefined
        ? [{ provide: DATABASE_PROBE, useClass: UnconfiguredDatabaseProbe }]
        : [PrismaService, { provide: DATABASE_PROBE, useClass: PrismaDatabaseProbe }];
    return {
      module: AppModule,
      imports: [TerminusModule],
      controllers: [StatusController, HealthController],
      providers: [
        { provide: APP_ENV, useValue: env },
        StatusService,
        DatabaseHealthIndicator,
        ...databaseProviders,
      ],
    };
  }
}
