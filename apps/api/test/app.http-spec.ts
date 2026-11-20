import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { statusResponseSchema } from '@blog/shared/status';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import type { AppEnv } from '../src/config/env.js';

const env: AppEnv = { PORT: 0, GIT_SHA: 'testsha0102', version: '0.1.0' };

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
  });
});
