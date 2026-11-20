import { describe, expect, it } from 'vitest';
import { statusQuerySchema, statusResponseSchema } from './status.js';

const validResponse = {
  service: 'api',
  version: '0.1.0',
  commit: 'abc1234',
  db: 'up',
  time: '2026-11-20T18:00:00.000Z',
};

describe('statusQuerySchema', () => {
  it('aplica detail=basic por padrão quando a query vem vazia', () => {
    expect(statusQuerySchema.parse({}).detail).toBe('basic');
  });

  it('aceita detail=full', () => {
    expect(statusQuerySchema.parse({ detail: 'full' }).detail).toBe('full');
  });

  it('rejeita detail fora de basic|full', () => {
    expect(statusQuerySchema.safeParse({ detail: 'bogus' }).success).toBe(false);
  });

  it('rejeita chave desconhecida na query', () => {
    expect(statusQuerySchema.safeParse({ detail: 'full', foo: '1' }).success).toBe(false);
  });
});

describe('statusResponseSchema', () => {
  it('aceita um payload completo e válido', () => {
    expect(statusResponseSchema.safeParse(validResponse).success).toBe(true);
  });

  it('rejeita payload sem commit', () => {
    const { commit: _commit, ...semCommit } = validResponse;
    expect(statusResponseSchema.safeParse(semCommit).success).toBe(false);
  });

  it('rejeita db fora de up|down', () => {
    expect(statusResponseSchema.safeParse({ ...validResponse, db: 'maybe' }).success).toBe(false);
  });

  it('rejeita time que não seja data ISO', () => {
    expect(statusResponseSchema.safeParse({ ...validResponse, time: 'ontem' }).success).toBe(false);
  });

  it('aceita dbLatencyMs opcional não negativo', () => {
    expect(statusResponseSchema.safeParse({ ...validResponse, dbLatencyMs: 12 }).success).toBe(true);
  });

  it('rejeita dbLatencyMs negativo', () => {
    expect(statusResponseSchema.safeParse({ ...validResponse, dbLatencyMs: -1 }).success).toBe(false);
  });
});
