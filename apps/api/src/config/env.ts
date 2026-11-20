// Versão provisória (Task 1 do 01-02): a Task 2 substitui por loadEnv() completo com Zod.
export const APP_ENV = Symbol('APP_ENV');

export interface AppEnv {
  PORT: number;
  GIT_SHA: string;
  version: string;
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  return {
    PORT: Number(source['PORT'] ?? 3001),
    GIT_SHA: source['GIT_SHA'] ?? 'dev',
    version: '0.1.0',
  };
}
