import { z } from 'zod';

// Contrato único do /status (SDD): a API valida query e saída com estes schemas
// e o web faz o parse da resposta.
// Regra de evolução: campo novo entra SEMPRE como opcional. Os deploys do web
// e da API não são atômicos (Pitfall 13), então os dois lados convivem por um tempo.

export const statusQuerySchema = z.strictObject({
  detail: z.enum(['basic', 'full']).default('basic'),
});

export const statusResponseSchema = z.object({
  service: z.literal('api'),
  version: z.string().min(1),
  commit: z.string().min(1),
  db: z.enum(['up', 'down']),
  time: z.iso.datetime(),
  dbLatencyMs: z.number().int().nonnegative().optional(),
});

export type StatusQuery = z.input<typeof statusQuerySchema>;
export type StatusQueryParsed = z.output<typeof statusQuerySchema>;
export type StatusResponse = z.infer<typeof statusResponseSchema>;
