export interface PrepareTestDbOptions {
  adminUrl?: string;
  dbName?: string;
  appApiPassword?: string;
}

export interface PreparedTestDb {
  /** Conexão com o papel `postgres` (migrations, inspeção de catálogo). */
  adminDbUrl: string;
  /** Conexão com o papel `app_api` (runtime da API). */
  appApiUrl: string;
}

export function prepareTestDb(options?: PrepareTestDbOptions): Promise<PreparedTestDb>;
