import * as Sentry from '@sentry/nextjs';

// Só o runtime Node do Next tem configuração do Sentry (o web não usa edge nesta fase).
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
}

export const onRequestError = Sentry.captureRequestError;
