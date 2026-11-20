import { statusResponseSchema, type StatusResponse } from '@blog/shared/status';

export type StatusResult =
  | { ok: true; data: StatusResponse }
  | { ok: false; reason: 'config' | 'timeout' | 'network' | 'http' | 'invalid' };

export interface GetStatusDeps {
  fetchImpl?: typeof fetch;
  baseUrl?: string;
  timeoutMs?: number;
}

// Busca o /status da API no servidor do Next (BFF). Nunca lança: qualquer falha vira
// `{ ok: false, reason }` para a página degradar (D-03) em vez de responder 500.
// A URL da API vem de API_URL (sem o prefixo de variável pública), então não vai para o bundle do navegador.
export async function getStatus(
  detail: 'basic' | 'full' = 'basic',
  deps: GetStatusDeps = {},
): Promise<StatusResult> {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const baseUrl = 'baseUrl' in deps ? deps.baseUrl : process.env.API_URL;
  const timeoutMs = deps.timeoutMs ?? 5000;

  if (!baseUrl) {
    return { ok: false, reason: 'config' };
  }

  try {
    const response = await fetchImpl(`${baseUrl}/status?detail=${detail}`, {
      signal: AbortSignal.timeout(timeoutMs),
      cache: 'no-store',
      headers: { accept: 'application/json' },
    });
    if (!response.ok) {
      return { ok: false, reason: 'http' };
    }
    const parsed = statusResponseSchema.safeParse(await response.json());
    if (!parsed.success) {
      return { ok: false, reason: 'invalid' };
    }
    return { ok: true, data: parsed.data };
  } catch {
    return { ok: false, reason: 'network' };
  }
}
