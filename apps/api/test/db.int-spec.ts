import { createServer, type Server, type Socket } from 'node:net';
import { ConsoleLogger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { inject } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { loadEnv } from '../src/config/env.js';

// Senha de teste local embutida em `appApiUrl`: não pode aparecer em nenhum log.
const TEST_SECRET = 'app_api_local_test';

async function createApp(databaseUrl: string): Promise<NestExpressApplication> {
  const env = loadEnv({ DATABASE_URL: databaseUrl, GIT_SHA: 'int', NODE_ENV: 'test' });
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule.forRoot(env)],
  }).compile();
  // O TestingLogger do módulo de teste só imprime `error`; os avisos do probe (`warn`) precisam
  // aparecer para o teste de vazamento de credencial não ser vazio.
  const app = moduleRef.createNestApplication<NestExpressApplication>({
    logger: new ConsoleLogger({ logLevels: ['warn', 'error'] }),
  });
  configureApp(app, env);
  await app.init();
  return app;
}

// Mesma credencial do `app_api`, apontando para outro host:porta.
function appApiUrlAt(host: string, port: number): string {
  const url = new URL(inject('appApiUrl'));
  url.hostname = host;
  url.port = String(port);
  return url.toString();
}

describe('API com banco real como app_api', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await createApp(inject('appApiUrl'));
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health/ready responde 200 com database up', async () => {
    const res = await request(app.getHttpServer()).get('/health/ready');

    expect(res.status).toBe(200);
    expect(res.body.info.database.status).toBe('up');
  });

  it('GET /health é alias de /health/ready e também lê o banco', async () => {
    const res = await request(app.getHttpServer()).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.info.database.status).toBe('up');
  });

  it('GET /status traz db up quando o banco responde', async () => {
    const res = await request(app.getHttpServer()).get('/status');

    expect(res.status).toBe(200);
    expect(res.body.db).toBe('up');
  });

  it('GET /status?detail=full traz dbLatencyMs inteiro >= 0', async () => {
    const res = await request(app.getHttpServer()).get('/status?detail=full');

    expect(res.status).toBe(200);
    expect(Number.isInteger(res.body.dbLatencyMs)).toBe(true);
    expect(res.body.dbLatencyMs).toBeGreaterThanOrEqual(0);
  });

  it('GET /status básico não traz dbLatencyMs', async () => {
    const res = await request(app.getHttpServer()).get('/status');

    expect(res.body).not.toHaveProperty('dbLatencyMs');
  });
});

describe('API com o banco fora do ar ou travado', () => {
  let captured = '';
  const restore: Array<() => void> = [];

  // Captura stdout/stderr (o logger do Nest escreve ali) para procurar vazamento da credencial.
  beforeEach(() => {
    captured = '';
    for (const stream of [process.stdout, process.stderr]) {
      const original = stream.write.bind(stream);
      stream.write = ((chunk: unknown, ...rest: unknown[]) => {
        captured += String(chunk);
        return (original as (...args: unknown[]) => boolean)(chunk, ...rest);
      }) as typeof stream.write;
      restore.push(() => {
        stream.write = original;
      });
    }
  });

  afterEach(() => {
    while (restore.length > 0) restore.pop()?.();
  });

  describe('porta fechada', () => {
    let app: NestExpressApplication;

    beforeAll(async () => {
      app = await createApp(appApiUrlAt('127.0.0.1', 1));
    });

    afterAll(async () => {
      await app.close();
    });

    it('/health/live continua 200 e /health/ready responde 503 com database down, no mesmo app', async () => {
      const live = await request(app.getHttpServer()).get('/health/live');
      const ready = await request(app.getHttpServer()).get('/health/ready');

      expect(live.status).toBe(200);
      expect(ready.status).toBe(503);
      expect(ready.body.error.database.status).toBe('down');
    });

    it('/status responde 200 com db down', async () => {
      const res = await request(app.getHttpServer()).get('/status');

      expect(res.status).toBe(200);
      expect(res.body.db).toBe('down');
    });

    it('a falha é logada sem a credencial nem a URL de conexão', async () => {
      await request(app.getHttpServer()).get('/status');
      await request(app.getHttpServer()).get('/health/ready');

      expect(captured).toContain('falha na leitura do banco');
      expect(captured).not.toContain(TEST_SECRET);
      expect(captured).not.toContain('postgresql://');
    });
  });

  describe('servidor TCP que aceita a conexão e nunca responde', () => {
    let app: NestExpressApplication;
    let server: Server;
    const sockets = new Set<Socket>();

    beforeAll(async () => {
      server = createServer((socket) => {
        sockets.add(socket);
        socket.on('error', () => undefined);
        socket.on('close', () => sockets.delete(socket));
      });
      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
      const address = server.address();
      if (address === null || typeof address === 'string')
        throw new Error('porta do servidor TCP indisponível');
      app = await createApp(appApiUrlAt('127.0.0.1', address.port));
    });

    afterAll(async () => {
      for (const socket of sockets) socket.destroy();
      await app.close();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    });

    it('/status responde em menos de 3000 ms com db down', async () => {
      const startedAt = performance.now();
      const res = await request(app.getHttpServer()).get('/status');
      const elapsedMs = performance.now() - startedAt;

      expect(res.status).toBe(200);
      expect(res.body.db).toBe('down');
      expect(elapsedMs).toBeLessThan(3000);
    });

    it('/health/ready responde 503 em menos de 3000 ms', async () => {
      const startedAt = performance.now();
      const res = await request(app.getHttpServer()).get('/health/ready');
      const elapsedMs = performance.now() - startedAt;

      expect(res.status).toBe(503);
      expect(elapsedMs).toBeLessThan(3000);
    });

    it('a espera pelo banco travado também não vaza a credencial nos logs', async () => {
      await request(app.getHttpServer()).get('/status');

      expect(captured).toContain('falha na leitura do banco');
      expect(captured).not.toContain(TEST_SECRET);
    });
  });
});
