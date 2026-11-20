import { Inject, Injectable, Logger } from '@nestjs/common';
import type { DatabaseProbe, DatabaseProbeResult } from '../status/status.service.js';
import { PrismaService } from './prisma.service.js';

const PROBE_TIMEOUT_MS = 2000;

class ProbeTimeoutError extends Error {
  override readonly name = 'ProbeTimeoutError';
}

// Leitura real da linha única de `heartbeat`: a mesma que o monitor de uptime dispara em produção
// (keep-alive de leitura, D-03). Nunca lança: qualquer falha vira `down`.
@Injectable()
export class PrismaDatabaseProbe implements DatabaseProbe {
  private readonly logger = new Logger(PrismaDatabaseProbe.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async check(): Promise<DatabaseProbeResult> {
    const startedAt = performance.now();
    let timer: NodeJS.Timeout | undefined;
    try {
      // O timeout cobre também a espera por conexão do pool, não só a consulta.
      const query = this.prisma.heartbeat.findUnique({ where: { id: 1 }, select: { id: true } });
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new ProbeTimeoutError()), PROBE_TIMEOUT_MS);
      });
      // Se o timeout vencer, a consulta continua pendente: evita rejeição sem tratamento depois.
      query.catch(() => undefined);
      const row = await Promise.race([query, timeout]);
      if (row === null) {
        this.logger.warn('heartbeat sem a linha id=1');
        return { state: 'down' };
      }
      return { state: 'up', latencyMs: Math.max(0, Math.round(performance.now() - startedAt)) };
    } catch (err) {
      // Só nome e código: o texto do erro do driver pode trazer host, usuário ou a URL.
      const name = err instanceof Error ? err.name : 'desconhecido';
      const rawCode = (err as { code?: unknown } | null)?.code;
      const code = typeof rawCode === 'string' ? rawCode : 'sem-codigo';
      this.logger.warn(`falha na leitura do banco: ${name} (${code})`);
      return { state: 'down' };
    } finally {
      clearTimeout(timer);
    }
  }
}
