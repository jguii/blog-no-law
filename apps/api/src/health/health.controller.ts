import { Controller, Get, Inject } from '@nestjs/common';
import { HealthCheck, HealthCheckService, type HealthCheckResult } from '@nestjs/terminus';
import { DatabaseHealthIndicator } from './database.indicator.js';

// Duas camadas de health:
// - `live`: processo vivo, nenhuma dependência. É o que a Render checa; se dependesse do banco,
//   uma oscilação do Supabase causaria loop de restart (a Render reinicia após 60 s de falha).
// - `ready` (e `/health`, alias): lê o banco de verdade. É o que o monitor de uptime dispara.
@Controller('health')
export class HealthController {
  constructor(
    @Inject(HealthCheckService) private readonly health: HealthCheckService,
    @Inject(DatabaseHealthIndicator) private readonly database: DatabaseHealthIndicator,
  ) {}

  @Get('live')
  live(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Get('ready')
  @HealthCheck()
  ready(): Promise<HealthCheckResult> {
    return this.checkDatabase();
  }

  @Get()
  @HealthCheck()
  overall(): Promise<HealthCheckResult> {
    return this.checkDatabase();
  }

  private checkDatabase(): Promise<HealthCheckResult> {
    return this.health.check([() => this.database.isHealthy()]);
  }
}
