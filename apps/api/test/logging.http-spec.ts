import { Writable } from 'node:stream';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { loadEnv } from '../src/config/env.js';

// Captura em memória o que o pino escreveria no stdout.
class CaptureStream extends Writable {
  readonly lines: string[] = [];

  override _write(chunk: Buffer | string, _encoding: BufferEncoding, done: () => void): void {
    for (const line of chunk.toString().split('\n')) {
      if (line.trim().length > 0) this.lines.push(line);
    }
    done();
  }

  clear(): void {
    this.lines.length = 0;
  }
}

type LogEntry = {
  req?: { id?: string; url?: string; headers?: Record<string, unknown> };
  res?: { headers?: Record<string, unknown> };
  clientIp?: string;
  [key: string]: unknown;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe('Logs estruturados da API (OPS-01)', () => {
  const stream = new CaptureStream();
  let app: NestExpressApplication;

  // O pino-http escreve no evento `finish`, que pode chegar depois da resposta ao cliente.
  async function entriesFor(url: string, expected = 1): Promise<LogEntry[]> {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const entries = stream.lines
        .map((line) => JSON.parse(line) as LogEntry)
        .filter((entry) => entry.req?.url === url);
      if (entries.length >= expected) return entries;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    return [];
  }

  beforeAll(async () => {
    const env = loadEnv({ GIT_SHA: 'testsha0107', NODE_ENV: 'test', TRUST_PROXY_HOPS: '1' });
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule.forRoot(env, { logDestination: stream })],
    }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app, env);
    await app.init();
  });

  beforeEach(() => {
    stream.clear();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('redação de segredos (T-01-14)', () => {
    const secretHeaders = {
      Authorization: 'Bearer abc.def.ghi',
      Cookie: 'sb=segredocookie',
      'X-Api-Key': 'chave-secreta-xyz',
    };

    it('emite cada linha de log como JSON válido', async () => {
      await request(app.getHttpServer()).get('/status').set(secretHeaders);
      const entries = await entriesFor('/status');

      expect(entries.length).toBeGreaterThan(0);
      expect(stream.lines.every((line) => line.startsWith('{'))).toBe(true);
    });

    it('troca authorization e cookie por [REDACTED]', async () => {
      await request(app.getHttpServer()).get('/status').set(secretHeaders);
      const [entry] = await entriesFor('/status');

      expect(entry?.req?.headers?.['authorization']).toBe('[REDACTED]');
      expect(entry?.req?.headers?.['cookie']).toBe('[REDACTED]');
    });

    it('troca x-api-key por [REDACTED]', async () => {
      await request(app.getHttpServer()).get('/status').set(secretHeaders);
      const [entry] = await entriesFor('/status');

      expect(entry?.req?.headers?.['x-api-key']).toBe('[REDACTED]');
    });

    it('nunca deixa o token literal nem o valor do cookie na saída', async () => {
      await request(app.getHttpServer()).get('/status').set(secretHeaders);
      const entries = await entriesFor('/status');
      const output = stream.lines.join('\n');

      expect(entries.length).toBeGreaterThan(0);
      expect(output.includes('abc.def.ghi')).toBe(false);
      expect(output.includes('segredocookie')).toBe(false);
      expect(output.includes('chave-secreta-xyz')).toBe(false);
    });
  });

  describe('request id', () => {
    it('gera req.id diferente para requisições simultâneas', async () => {
      await Promise.all([
        request(app.getHttpServer()).get('/status?detail=basic'),
        request(app.getHttpServer()).get('/status?detail=full'),
      ]);
      const basic = await entriesFor('/status?detail=basic');
      const full = await entriesFor('/status?detail=full');

      expect(basic[0]?.req?.id).toBeDefined();
      expect(full[0]?.req?.id).toBeDefined();
      expect(basic[0]?.req?.id).not.toBe(full[0]?.req?.id);
    });

    it('aceita um x-request-id válido, registra no log e devolve no header', async () => {
      const res = await request(app.getHttpServer())
        .get('/status')
        .set('X-Request-Id', 'probe-123');
      const [entry] = await entriesFor('/status');

      expect(entry?.req?.id).toBe('probe-123');
      expect(res.headers['x-request-id']).toBe('probe-123');
    });

    it('ignora x-request-id de 65 caracteres e troca por um UUID', async () => {
      const longId = 'a'.repeat(65);
      const res = await request(app.getHttpServer()).get('/status').set('X-Request-Id', longId);
      const [entry] = await entriesFor('/status');

      expect(UUID.test(String(entry?.req?.id))).toBe(true);
      expect(UUID.test(String(res.headers['x-request-id']))).toBe(true);
    });

    it('ignora x-request-id com espaço e troca por um UUID', async () => {
      const res = await request(app.getHttpServer())
        .get('/status')
        .set('X-Request-Id', 'tem espaco');
      const [entry] = await entriesFor('/status');

      expect(UUID.test(String(entry?.req?.id))).toBe(true);
      expect(UUID.test(String(res.headers['x-request-id']))).toBe(true);
    });

    it('gera um UUID quando não há x-request-id', async () => {
      const res = await request(app.getHttpServer()).get('/status');
      const [entry] = await entriesFor('/status');

      expect(UUID.test(String(entry?.req?.id))).toBe(true);
      expect(res.headers['x-request-id']).toBe(entry?.req?.id);
    });
  });

  describe('clientIp e ruído', () => {
    it('registra clientIp pelo trust proxy de 1 hop e ignora o valor forjado à esquerda', async () => {
      await request(app.getHttpServer()).get('/status').set('X-Forwarded-For', '1.2.3.4, 5.6.7.8');
      const [entry] = await entriesFor('/status');

      expect(entry?.clientIp).toBe('5.6.7.8');
    });

    it('não registra requisição de GET /health/live, mas registra GET /status', async () => {
      await request(app.getHttpServer()).get('/health/live');
      await request(app.getHttpServer()).get('/status');
      const status = await entriesFor('/status');
      const live = stream.lines
        .map((line) => JSON.parse(line) as LogEntry)
        .filter((entry) => entry.req?.url === '/health/live');

      expect(status.length).toBe(1);
      expect(live.length).toBe(0);
    });
  });
});
