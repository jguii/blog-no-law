---
gsd_state_version: "1.0"
current_phase: 1
current_phase_name: Esqueleto no ar com testes e CI
status: executing
stopped_at: Session resumed, resuming Phase 1 planner
last_updated: "2026-11-19T13:31:13.170Z"
last_activity: 2026-11-14
last_activity_desc: Roadmap criado (8 fases, 55/55 requisitos v1 mapeados)
state_head: b3f73c4f745f0015fa1d49e8871a946afa2f198e
progress:
  total_phases: 8
  completed_phases: 0
  total_plans: 14
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-11-14)

**Core value:** Membros do clã conseguem publicar e reencontrar a história do grupo — posts com imagens/vídeos, organizados por ano e categoria, navegáveis por qualquer pessoa.
**Current focus:** Phase 1 - Esqueleto no ar com testes e CI

## Current Position

Phase: 1 (Esqueleto no ar com testes e CI) — READY TO EXECUTE
Plan: 0 of TBD in current phase
Status: Ready to execute
Last activity: 2026-11-14 — Roadmap criado (8 fases, 55/55 requisitos v1 mapeados)

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: -
- Trend: -

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: 8 fases verticais (modo MVP); cada uma termina implantada e com os próprios testes verdes.
- [Roadmap]: A identidade visual (Fase 2) vem antes de qualquer tela real, e o login Discord (Fase 3) vem antes de qualquer conteúdo.
- [Roadmap]: A auditoria e os jobs (pg-boss) entram com a moderação (Fase 4); os comentários só depois das ferramentas de moderação (Fase 7).
- [Roadmap]: O SEC-02 (rate limit) é verificado em conjunto na Fase 7; cada fase aplica limite e validação às rotas que cria.
- [Roadmap]: Eras e conquistas ficam isoladas na Fase 8 (dependem só da Fase 6) e podem ser adiadas sem bloquear o lançamento.
- [Fase 1]: Oracle descartada (exige CNPJ); API na Render (Virginia), plano B Railway em boot único; Supabase us-east-1, Vercel iad1. Só .claude/CLAUDE.md vai para o repo público. Repo público, branch por fase + PR, deploy automático. ORM: Prisma 7.10.1.

### Pending Todos

None yet.

### Blockers/Concerns

- [Fase 1] Criar o projeto Supabase só depois de definida a região da API (região do Supabase é imutável).
- [Fase 5] `sharp` num container de ~512 MB pode estourar memória.
- [Fase 5] Definir a política para GIFs animados: recusar, usar o primeiro quadro ou converter para WebP animado com limite.
- [Fase 7] Qualquer usuário Discord pode comentar, mas ban/mute e denúncia estão em "Ideias futuras". Mitigação: rate limit e remoção por moderador. Reavaliar antes de divulgar o blog.
- [Fases 1, 3, 4, 5, 6] Há spikes indicados pela pesquisa; ver "Notas transversais" no ROADMAP.md.

## Deferred Items

Items acknowledged and deferred at milestone close, most recent first:

| Category | Item | Status | Deferred At | Milestone |
|----------|------|--------|-------------|-----------|
| *(none)* | | | | |

## Session Continuity

Last session: 2026-11-17T20:01:43.269Z
Stopped at: Session resumed, resuming Phase 1 planner
Resume file: .planning/phases/01-esqueleto-no-ar-com-testes-e-ci/.continue-here.md
