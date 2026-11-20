import { Inject, Injectable } from '@nestjs/common';
import type { StatusQueryParsed, StatusResponse } from '@blog/shared/status';
import { APP_ENV, type AppEnv } from '../config/env.js';

export const DATABASE_PROBE = Symbol('DATABASE_PROBE');

export interface DatabaseProbeResult {
  state: 'up' | 'down';
  latencyMs?: number;
}

// Porta de banco do /status. O 01-05 troca a implementação por uma leitura real do `heartbeat`.
export interface DatabaseProbe {
  check(): Promise<DatabaseProbeResult>;
}

// Comportamento real e permanente de uma API sem DATABASE_URL: o banco consta como 'down'.
@Injectable()
export class UnconfiguredDatabaseProbe implements DatabaseProbe {
  check(): Promise<DatabaseProbeResult> {
    return Promise.resolve({ state: 'down' });
  }
}

@Injectable()
export class StatusService {
  constructor(
    @Inject(APP_ENV) private readonly env: AppEnv,
    @Inject(DATABASE_PROBE) private readonly database: DatabaseProbe,
  ) {}

  async snapshot(detail: StatusQueryParsed['detail']): Promise<StatusResponse> {
    const probe = await this.database.check();
    const snapshot: StatusResponse = {
      service: 'api',
      version: this.env.version,
      commit: this.env.GIT_SHA,
      db: probe.state,
      time: new Date().toISOString(),
    };
    if (detail === 'full' && probe.latencyMs !== undefined) {
      snapshot.dbLatencyMs = probe.latencyMs;
    }
    return snapshot;
  }
}
