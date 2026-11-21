import { Controller, Get, Inject, NotFoundException } from '@nestjs/common';
import { APP_ENV, type AppEnv } from '../config/env.js';

// Provoca um erro de propósito para provar o caminho até o Sentry. Desligada por padrão:
// só responde com DEBUG_ROUTES_ENABLED=true (usado no boot de verificação, T-01-16).
@Controller('_debug')
export class DebugController {
  constructor(@Inject(APP_ENV) private readonly env: AppEnv) {}

  @Get('error')
  error(): never {
    if (!this.env.DEBUG_ROUTES_ENABLED) {
      throw new NotFoundException();
    }
    // Erro genérico: o filtro responde 500 sem stack e o Sentry recebe o original.
    throw new Error('sentry-smoke');
  }
}
