import { StandardSchemaValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { AppEnv } from './config/env.js';

// Única fonte da configuração HTTP: o main.ts e os testes HTTP chamam esta função,
// então o teste exercita exatamente o que roda em produção.
export function configureApp(app: NestExpressApplication, _env: AppEnv): void {
  app.useGlobalPipes(new StandardSchemaValidationPipe());
  app.enableShutdownHooks();
}
