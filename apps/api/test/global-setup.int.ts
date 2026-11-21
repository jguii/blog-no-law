import type { TestProject } from 'vitest/node';
import { prepareTestDb } from '../scripts/prepare-test-db.mjs';

declare module 'vitest' {
  export interface ProvidedContext {
    adminDbUrl: string;
    appApiUrl: string;
  }
}

// Apaga e recria o banco `blog_test` a cada execução: uma execução interrompida
// não deixa estado que quebre a próxima.
export default async function setup(project: TestProject): Promise<void> {
  const { adminDbUrl, appApiUrl } = await prepareTestDb({
    adminUrl: process.env.DATABASE_URL_TEST_ADMIN,
  });
  project.provide('adminDbUrl', adminDbUrl);
  project.provide('appApiUrl', appApiUrl);
}
