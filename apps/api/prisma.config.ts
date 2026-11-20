import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Prisma 7: a URL do datasource vive aqui (não existe `directUrl`). Migrações usam a
// credencial `postgres` (MIGRATE_DATABASE_URL); o runtime da API usa `app_api` e não passa por este arquivo.
// Sem lançar quando ausente, para `prisma generate` funcionar no build da imagem e da CI.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: process.env.MIGRATE_DATABASE_URL ?? '' },
});
