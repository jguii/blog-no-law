import { statusResponseSchema, type StatusResponse } from '@blog/shared/status';

export type StatusFailureReason = 'config' | 'timeout' | 'network' | 'http' | 'invalid';

export type StatusResult =
  | { ok: true; data: StatusResponse }
  | { ok: false; reason: StatusFailureReason };

export interface GetStatusDeps {
  fetchImpl?: typeof fetch;
  baseUrl?: string;
  timeoutMs?: number;
}

function isTimeout(error: unknown): boolean {
  return error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');
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

  // O sinal é repassado ao fetch, mas a corrida abaixo garante o prazo mesmo se a
  // implementação de fetch ignorar o sinal (D-03: a página nunca espera a Render acordar).
  const signal = AbortSignal.timeout(timeoutMs);
  const deadline = new Promise<never>((_, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), { once: true });
  });
  deadline.catch(() => undefined); // evita rejeição não tratada quando o prazo vence depois da resposta

  let response: Response;
  try {
    response = await Promise.race([
      fetchImpl(`${baseUrl}/status?detail=${detail}`, {
        signal,
        cache: 'no-store',
        headers: { accept: 'application/json' },
      }),
      deadline,
    ]);
  } catch (error) {
    return { ok: false, reason: isTimeout(error) ? 'timeout' : 'network' };
  }

  if (!response.ok) {
    return { ok: false, reason: 'http' };
  }

  let body: unknown;
  try {
    body = await Promise.race([response.json(), deadline]);
  } catch (error) {
    return { ok: false, reason: isTimeout(error) ? 'timeout' : 'invalid' };
  }

  const parsed = statusResponseSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, reason: 'invalid' };
  }
  return { ok: true, data: parsed.data };
}
