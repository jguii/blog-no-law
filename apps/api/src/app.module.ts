import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Writable } from 'node:stream';
import { Module, type DynamicModule, type Provider } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { LoggerModule } from 'nestjs-pino';
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

export type AppModuleOptions = {
  // Só para testes: para onde o pino escreve (o padrão é o stdout).
  logDestination?: Writable;
};

// Aceita só ids curtos e sem espaço: o valor vai para o log e para um header de resposta.
const REQUEST_ID_PATTERN = /^[A-Za-z0-9._-]{1,64}$/;

// Segredos que nunca podem aparecer em log (T-01-14).
const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["x-api-key"]',
  'res.headers["set-cookie"]',
  '*.token',
  '*.password',
  '*.secret',
  '*.connectionString',
];

function resolveRequestId(req: IncomingMessage, res: ServerResponse): string {
  const incoming = req.headers['x-request-id'];
  const id =
    typeof incoming === 'string' && REQUEST_ID_PATTERN.test(incoming) ? incoming : randomUUID();
  res.setHeader('x-request-id', id);
  return id;
}

@Module({})
export class AppModule {
  static forRoot(env: AppEnv, options: AppModuleOptions = {}): DynamicModule {
    // Com DATABASE_URL, o banco real (como `app_api`); sem ela, o probe 'down' permanente.
    const databaseProviders: Provider[] =
      env.DATABASE_URL === undefined
        ? [{ provide: DATABASE_PROBE, useClass: UnconfiguredDatabaseProbe }]
        : [PrismaService, { provide: DATABASE_PROBE, useClass: PrismaDatabaseProbe }];

    // JSON também em dev (sem pino-pretty); `clientIp` já respeita o `trust proxy`.
    const pinoOptions = {
      level: env.LOG_LEVEL,
      genReqId: resolveRequestId,
      customProps: (req: IncomingMessage) => ({
        clientIp: (req as IncomingMessage & { ip?: string }).ip,
      }),
      // O monitor de uptime bate em /health/live a cada poucos minutos: só ruído.
      autoLogging: { ignore: (req: IncomingMessage) => req.url?.split('?')[0] === '/health/live' },
      redact: { paths: REDACT_PATHS, censor: '[REDACTED]' },
    };

    return {
      module: AppModule,
      imports: [
        TerminusModule,
        LoggerModule.forRoot({
          pinoHttp:
            options.logDestination === undefined
              ? pinoOptions
              : [pinoOptions, options.logDestination],
        }),
      ],
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
