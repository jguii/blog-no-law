import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { inject } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { loadEnv } from '../src/config/env.js';

describe('API com banco real como app_api', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    const env = loadEnv({ DATABASE_URL: inject('appApiUrl'), GIT_SHA: 'int', NODE_ENV: 'test' });
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

  it('GET /health/ready responde 200 com database up', async () => {
    const res = await request(app.getHttpServer()).get('/health/ready');

    expect(res.status).toBe(200);
    expect(res.body.info.database.status).toBe('up');
  });

  it('GET /status traz db up quando o banco responde', async () => {
    const res = await request(app.getHttpServer()).get('/status');

    expect(res.status).toBe(200);
    expect(res.body.db).toBe('up');
  });
});
