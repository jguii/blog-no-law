---
phase: 01-esqueleto-no-ar-com-testes-e-ci
fixed_at: 2026-11-27T02:40:00Z
review_path: .planning/phases/01-esqueleto-no-ar-com-testes-e-ci/01-REVIEW.md
iteration: 1
findings_in_scope: 2
fixed: 2
skipped: 0
status: all_fixed
---

# Fase 1: Relatório de correção do code review

**Corrigido em:** 2026-11-27T02:40:00Z
**Revisão de origem:** .planning/phases/01-esqueleto-no-ar-com-testes-e-ci/01-REVIEW.md
**Iteração:** 1

**Resumo:**
- Achados no escopo: 2 (escopo `critical_warning`; os 4 achados IN-* ficam fora)
- Corrigidos: 2
- Pulados: 0

## Corrigidos

### WR-01: `TRUST_PROXY_HOPS` só com espaços (ou `0x..`) vira 0 e desliga o trust proxy em silêncio

**Arquivos modificados:** `apps/api/src/config/env.spec.ts`, `apps/api/src/config/env.ts`
**Commits:** `2a9f473` (teste, RED), `9645002` (correção, GREEN)
**Status:** corrigido, exige verificação humana (lógica de validação)
**Correção aplicada:** novo helper `digitsOnly` em `env.ts`: apara espaço e quebra de linha, trata o resultado vazio como ausente (cai no default `1`) e transforma qualquer string que não seja só dígitos decimais em `NaN`, o que falha no boot citando `TRUST_PROXY_HOPS` sem expor o valor. Aplicado a `TRUST_PROXY_HOPS` e a `PORT`, como sugerido no review. Faixa `0..3` mantida (`'9'` continua rejeitado).

Ciclo TDD (`pnpm exec vitest run --project unit src/config/env.spec.ts`, em `apps/api`):
- RED: 2 falhas, 12 passando (`' '` retornava 0 em vez de 1; `'0x2'` não lançava erro).
- GREEN: 14 de 14 passando, incluindo os testes antigos.

Casos novos em `env.spec.ts`: `' '` e `'\n'` valem default 1; `' 2\n'` vale 2; `'0x2'`, `'1.5'` e `'1e0'` lançam erro com `TRUST_PROXY_HOPS`; `'0'..'3'` aceitos e `'9'` rejeitado. Prettier e `tsc --noEmit` sem erros em `env.ts`.

### WR-02: o plano B manda copiar `TRUST_PROXY_HOPS` da Render (valor 3) para um host novo

**Arquivo modificado:** `docs/runbooks/plano-b-railway.md`
**Commit:** `495787e`
**Correção aplicada:** no passo 3 de "Religar em emergência", `TRUST_PROXY_HOPS` saiu da lista de variáveis copiadas, com aviso explícito para não copiar o `3` da Render e deixar o default seguro `1` no primeiro boot. Novo passo 6 manda rodar a sonda da secção "Sonda do trust proxy (D-02)" do `render.md` no host novo e só então fixar o valor medido; os passos seguintes foram renumerados (7 e 8). `pnpm exec prettier --check` passou.

## Verificação

Os testes e checagens rodaram no worktree isolado `.claude/worktrees/rf-01-421173-1795746604` (dependências instaladas com `pnpm install --offline --frozen-lockfile --ignore-scripts`), não no checkout principal. Suíte completa, lint do projeto inteiro e testes de integração não foram executados (fora do escopo por achado).

## Pulados

Nenhum.

## Fora do escopo (permanecem no REVIEW.md)

IN-01, IN-02, IN-03 e IN-04 (`fix_scope: critical_warning`).

---

_Corrigido: 2026-11-27T02:40:00Z_
_Corretor: Claude (gsd-code-fixer)_
_Iteração: 1_
