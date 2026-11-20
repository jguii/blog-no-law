import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { statusResponseSchema } from '@blog/shared/status';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { loadEnv } from '../src/config/env.js';

const env = loadEnv({ GIT_SHA: 'testsha0102', NODE_ENV: 'test' });

describe('API HTTP', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule.forRoot(env)],
    }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app, env);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /status', () => {
    it('devolve 200 com corpo válido pelo contrato, commit igual ao GIT_SHA e db down sem banco', async () => {
      const res = await request(app.getHttpServer()).get('/status');

      expect(res.status).toBe(200);
      const parsed = statusResponseSchema.safeParse(res.body);
      expect(parsed.success).toBe(true);
      expect(res.body.commit).toBe('testsha0102');
      expect(res.body.db).toBe('down');
    });

    it('aceita detail=full e continua dentro do contrato', async () => {
      const res = await request(app.getHttpServer()).get('/status?detail=full');

      expect(res.status).toBe(200);
      expect(statusResponseSchema.safeParse(res.body).success).toBe(true);
    });

    it('responde 400 para detail fora de basic|full (T-01-04)', async () => {
      const res = await request(app.getHttpServer()).get('/status?detail=bogus');

      expect(res.status).toBe(400);
    });

    it('responde 400 para chave desconhecida na query (strictObject)', async () => {
      const res = await request(app.getHttpServer()).get('/status?foo=1');

      expect(res.status).toBe(400);
    });
  });

  describe('GET /health/live', () => {
    it('responde 200 com status ok, sem depender de banco', async () => {
      const res = await request(app.getHttpServer()).get('/health/live');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok' });
    });
  });
});
