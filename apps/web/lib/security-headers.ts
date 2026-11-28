// Esqueleto do RED (02-08): o contrato real entra no commit GREEN.
export type HeaderOptions = { isDev?: boolean; sentryDsn?: string | undefined };
export type HeaderRule = { source: string; headers: { key: string; value: string }[] };

export const NOINDEX_ROUTES: readonly string[] = [];

export function securityHeaders(options: HeaderOptions = {}): HeaderRule[] {
  void options;
  return [];
}
