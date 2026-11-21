# Imagem da API (D-10): linux/amd64, multi-stage, usuário não-root.
# Contexto de build = RAIZ do repositório: docker build -f apps/api/Dockerfile .
# Segredos nunca entram na imagem (repositório e imagem são públicos): a plataforma injeta
# DATABASE_URL, SENTRY_DSN etc. por variável de ambiente em tempo de execução.

# ---- build: instala, compila e isola só o necessário para produção em /out ----
FROM node:26-bookworm-slim AS build
# O `prepare` da raiz roda o husky, que não funciona sem .git.
ENV HUSKY=0
RUN npm install -g pnpm@12.21.0
WORKDIR /repo

# Manifestos primeiro: a camada de `pnpm install` só invalida quando as dependências mudam.
# O package.json do web precisa estar presente para o lockfile do workspace bater.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile --filter @blog/api...

COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter @blog/shared build \
 && pnpm --filter @blog/api build \
 && pnpm --filter @blog/api deploy --prod /out

# ---- runtime ----
FROM node:26-bookworm-slim
ENV NODE_ENV=production
ARG GIT_SHA
ENV GIT_SHA=$GIT_SHA
ARG SOURCE_URL
LABEL org.opencontainers.image.source=$SOURCE_URL
WORKDIR /app
COPY --from=build --chown=node:node /out ./
# CA pública do Supabase (a conexão `sslmode=require` do `pg` verifica a cadeia).
COPY --chown=node:node apps/api/certs/supabase-ca.crt /app/certs/supabase-ca.crt
ENV NODE_EXTRA_CA_CERTS=/app/certs/supabase-ca.crt
# A Render injeta PORT=10000; o padrão serve ao Railway e ao docker run local.
ENV PORT=10000
USER node
EXPOSE 10000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+process.env.PORT+'/health/live').then((r)=>process.exit(r.ok?0:1),()=>process.exit(1))"]
CMD ["node", "--enable-source-maps", "--import", "./dist/instrument.js", "dist/main.js"]
