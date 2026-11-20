import { Inject, Injectable, type OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { APP_ENV, type AppEnv } from '../config/env.js';
import { PrismaClient } from '../generated/prisma/client.js';

// Cliente Prisma da API. Conecta como `app_api` (a URL vem do env) pelo adapter do `pg`.
// A conexão é preguiçosa: subir a API com o banco fora do ar não derruba o processo.
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(@Inject(APP_ENV) env: AppEnv) {
    if (env.DATABASE_URL === undefined) {
      throw new Error('PrismaService exige DATABASE_URL');
    }
    super({
      adapter: new PrismaPg({
        connectionString: env.DATABASE_URL,
        // Pool pequeno (free tier do Supabase) e timeouts explícitos: o `pg` não tem timeout de conexão por padrão.
        max: 5,
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
      }),
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
