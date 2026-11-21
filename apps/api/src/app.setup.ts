import { StandardSchemaValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import type { AppEnv } from './config/env.js';

// Única fonte da configuração HTTP: o main.ts e os testes HTTP chamam esta função,
// então o teste exercita exatamente o que roda em produção.
export function configureApp(app: NestExpressApplication, env: AppEnv): void {
  // Número de saltos de proxy confiáveis (D-02), nunca `true`: com `true` o primeiro
  // valor do X-Forwarded-For (forjável pelo cliente) viraria o IP do cliente.
  app.set('trust proxy', env.TRUST_PROXY_HOPS);

  // A API só serve JSON: CSP fechada, sem frames. O CSP do navegador mora no Next.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
      },
      crossOriginResourcePolicy: { policy: 'same-site' },
    }),
  );

  // Allowlist exata. Recusa = ausência do header (o navegador bloqueia). Sem `Origin`
  // (chamada servidor a servidor do BFF) não há CORS a aplicar. Sem credenciais.
  app.enableCors({
    origin: (origin, callback) => {
      callback(null, origin !== undefined && env.CORS_ORIGINS.includes(origin));
    },
    credentials: false,
    methods: ['GET', 'HEAD', 'OPTIONS'],
  });

  app.useGlobalPipes(new StandardSchemaValidationPipe());
  app.enableShutdownHooks();
}
