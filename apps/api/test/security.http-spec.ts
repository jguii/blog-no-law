import { Controller, Get, Req } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { loadEnv } from '../src/config/env.js';

const ALLOWED_ORIGIN = 'https://blog-no-law.vercel.app';
const FOREIGN_ORIGIN = 'https://evil.example.com';

// Rota só dos testes: devolve o IP que o Express calculou com `trust proxy`.
@Controller('__probe')
class IpProbeController {
  @Get('ip')
  ip(@Req() req: { ip?: string }): { ip: string | undefined } {
    return { ip: req.ip };
  }
}

async function createApp(overrides: Record<string, string> = {}): Promise<NestExpressApplication> {
  const env = loadEnv({
    GIT_SHA: 'testsha0107',
    NODE_ENV: 'test',
    CORS_ORIGINS: ALLOWED_ORIGIN,
    ...overrides,
  });
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule.forRoot(env)],
    controllers: [IpProbeController],
  }).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>();
  configureApp(app, env);
  await app.init();
  return app;
}

describe('Segurança HTTP da API (SEC-03)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await createApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Helmet', () => {
    it('envia content-security-policy com default-src none e frame-ancestors none', async () => {
      const res = await request(app.getHttpServer()).get('/health/live');

      const csp = String(res.headers['content-security-policy']);
      expect(csp.includes("default-src 'none'")).toBe(true);
      expect(csp.includes("frame-ancestors 'none'")).toBe(true);
    });

    it('envia x-content-type-options nosniff', async () => {
      const res = await request(app.getHttpServer()).get('/health/live');

      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('envia strict-transport-security', async () => {
      const res = await request(app.getHttpServer()).get('/health/live');

      expect(res.headers['strict-transport-security']).toBeDefined();
    });

    it('não expõe x-powered-by', async () => {
      const res = await request(app.getHttpServer()).get('/health/live');

      expect(res.headers['x-powered-by']).toBeUndefined();
    });

    it('envia os headers de segurança também em respostas de erro (404)', async () => {
      const res = await request(app.getHttpServer()).get('/rota-que-nao-existe');

      expect(res.status).toBe(404);
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(String(res.headers['content-security-policy']).includes("default-src 'none'")).toBe(true);
    });
  });

  describe('CORS por allowlist', () => {
    it('devolve access-control-allow-origin com o próprio valor para uma origem da lista', async () => {
      const res = await request(app.getHttpServer()).get('/health/live').set('Origin', ALLOWED_ORIGIN);

      expect(res.status).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBe(ALLOWED_ORIGIN);
    });

    it('não devolve access-control-allow-origin para uma origem fora da lista', async () => {
      const res = await request(app.getHttpServer()).get('/health/live').set('Origin', FOREIGN_ORIGIN);

      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('não devolve access-control-allow-origin no preflight OPTIONS de origem fora da lista', async () => {
      const res = await request(app.getHttpServer())
        .options('/status')
        .set('Origin', FOREIGN_ORIGIN)
        .set('Access-Control-Request-Method', 'GET');

      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('responde ao preflight OPTIONS de uma origem da lista com o próprio valor', async () => {
      const res = await request(app.getHttpServer())
        .options('/status')
        .set('Origin', ALLOWED_ORIGIN)
        .set('Access-Control-Request-Method', 'GET');

      expect(res.headers['access-control-allow-origin']).toBe(ALLOWED_ORIGIN);
    });

    it('atende chamada servidor a servidor sem Origin e sem header CORS', async () => {
      const res = await request(app.getHttpServer()).get('/health/live');

      expect(res.status).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('não habilita credenciais (sem access-control-allow-credentials)', async () => {
      const res = await request(app.getHttpServer()).get('/health/live').set('Origin', ALLOWED_ORIGIN);

      expect(res.headers['access-control-allow-credentials']).toBeUndefined();
    });
  });

  describe('trust proxy por contagem de hops (D-02)', () => {
    it('com 1 hop usa o último valor do X-Forwarded-For e ignora o forjado à esquerda', async () => {
      const res = await request(app.getHttpServer())
        .get('/__probe/ip')
        .set('X-Forwarded-For', '1.2.3.4, 5.6.7.8');

      expect(res.body.ip).toBe('5.6.7.8');
    });

    it('com 2 hops usa o penúltimo valor da cadeia', async () => {
      const twoHops = await createApp({ TRUST_PROXY_HOPS: '2' });
      try {
        const res = await request(twoHops.getHttpServer())
          .get('/__probe/ip')
          .set('X-Forwarded-For', '1.2.3.4, 5.6.7.8');

        expect(res.body.ip).toBe('1.2.3.4');
      } finally {
        await twoHops.close();
      }
    });

    it('com 0 hops ignora o X-Forwarded-For e usa o endereço do socket', async () => {
      const noProxy = await createApp({ TRUST_PROXY_HOPS: '0' });
      try {
        const res = await request(noProxy.getHttpServer())
          .get('/__probe/ip')
          .set('X-Forwarded-For', '1.2.3.4, 5.6.7.8');

        expect(res.body.ip).not.toBe('1.2.3.4');
        expect(res.body.ip).not.toBe('5.6.7.8');
      } finally {
        await noProxy.close();
      }
    });
  });
});
