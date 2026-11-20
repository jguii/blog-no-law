import { Inject, Injectable } from '@nestjs/common';
import { HealthIndicatorService, type HealthIndicatorResult } from '@nestjs/terminus';
import { DATABASE_PROBE, type DatabaseProbe } from '../status/status.service.js';

// Indicador de banco do Terminus 12 (API up()/down()). O corpo só expõe estado e latência em ms.
@Injectable()
export class DatabaseHealthIndicator {
  constructor(
    @Inject(HealthIndicatorService) private readonly indicators: HealthIndicatorService,
    @Inject(DATABASE_PROBE) private readonly database: DatabaseProbe,
  ) {}

  async isHealthy(): Promise<HealthIndicatorResult> {
    const indicator = this.indicators.check('database');
    const probe = await this.database.check();
    if (probe.state === 'down') {
      return indicator.down();
    }
    return probe.latencyMs === undefined ? indicator.up() : indicator.up({ latencyMs: probe.latencyMs });
  }
}
