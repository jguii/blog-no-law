---
phase: "2"
slug: "identidade-visual-no-law"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-11-27"
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Fonte: `02-RESEARCH.md` § Validation Architecture. Os IDs de tarefa são preenchidos quando os PLANs existirem.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.12 (projetos `unit` e `int` em `apps/web`), Playwright 1.65.1 + `@axe-core/playwright` 4.14.0 (E2E, só na CI), `node:test` para scripts da raiz |
| **Config file** | `apps/web/vitest.config.ts` (existe; `include` passa a aceitar `.tsx`), `apps/web/playwright.config.ts` (existe; ganha o projeto `mobile` e `reducedMotion`) |
| **Quick run command** | `pnpm --filter @blog/web test` |
| **Full suite command** | `docker compose -f compose.test.yaml up -d --wait && pnpm run verify` (local); check `ci-ok` na CI (inclui `e2e`) |
| **Estimated runtime** | ~10 s (unit); ~120 s (verify local); E2E só na CI |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @blog/web test` (e `pnpm --filter @blog/web test:integration` se a tarefa tocou páginas)
- **After every plan wave:** Run `docker compose -f compose.test.yaml up -d --wait && pnpm run verify`
- **Before `/gsd-verify-work`:** `ci-ok` verde no PR da fase (E2E com axe nos dois temas e no celular)
- **Max feedback latency:** 120 seconds (local); E2E depende da CI

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | VIS-01 | — | N/A | unit (contrato de contraste) | `pnpm --filter @blog/web test -- lib/contrast.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | VIS-01 / UX-02 | T-02 (localStorage → `data-theme`) | Só `light`/`dark` são aceitos; valor inválido cai no padrão `dark` | unit | `pnpm --filter @blog/web test -- lib/theme.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | VIS-01 | — | N/A | e2e (CI, axe nos dois temas) | `pnpm --filter @blog/web test:e2e -- identidade.spec.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | VIS-02 | — | N/A | unit (`renderToStaticMarkup`) | `pnpm --filter @blog/web test -- components/site-header.test.tsx components/site-footer.test.tsx` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | VIS-02 | — | N/A | unit (metadados) | `pnpm --filter @blog/web test -- app/layout.test.tsx` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | VIS-02 | — | N/A | unit (dimensões dos ativos) | `pnpm --filter @blog/web test -- lib/brand-assets.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | VIS-02 | — | N/A | e2e (CI, preview e ícones) | `pnpm --filter @blog/web test:e2e -- identidade.spec.ts -g "preview"` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | VIS-03 | — | `/kit` com `noindex` (meta e `X-Robots-Tag`) | unit + e2e | `pnpm --filter @blog/web test -- app/kit/page.test.tsx` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | VIS-03 | — | N/A | unit (variantes por token) | `pnpm --filter @blog/web test -- components/ui/button.test.tsx` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | UX-01 | — | N/A | e2e (CI, 320/375/412 px) | `pnpm --filter @blog/web test:e2e -- --project=mobile` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | UX-01 | — | N/A | e2e (CI, menu sanduíche) | `pnpm --filter @blog/web test:e2e -- identidade.spec.ts -g "menu"` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | UX-02 | — | N/A | e2e (CI, troca, persistência, sem flash) | `pnpm --filter @blog/web test:e2e -- identidade.spec.ts -g "tema"` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | UX-02 | — | N/A | unit (rótulo acessível) | `pnpm --filter @blog/web test -- components/theme-toggle.test.tsx` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | UX-03 | — | Privacidade não cita "LGPD" (D-14) | unit + e2e | `pnpm --filter @blog/web test -- app/privacidade/page.test.tsx` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | D-07 | — | `/status` mantém o degradado com 200 | integration + e2e | `pnpm --filter @blog/web test:integration` | ✅ (mover de `test/home.int-spec.ts`) | ⬜ pending |
| TBD | TBD | TBD | CSP | T-02 (XSS, clickjacking) | `frame-ancestors 'none'`, `object-src 'none'`, sem `*` em `script-src` | unit | `pnpm --filter @blog/web test -- next.config.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | CSP | T-02 | Nenhuma violação de CSP no console | e2e (CI) | `pnpm --filter @blog/web test:e2e -- identidade.spec.ts -g "CSP"` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | D-20 | — | N/A | e2e (CI, pétalas e `prefers-reduced-motion`) | `pnpm --filter @blog/web test:e2e -- identidade.spec.ts -g "pétalas"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `docs/bdd/identidade-visual.feature.md` e `docs/bdd/paginas-institucionais.feature.md` (Dado/Quando/Então com tags `@integration`/`@e2e`); `docs/bdd/home.feature.md` passa a cobrir `/status` (D-07)
- [ ] `apps/web/lib/theme.test.ts`, `lib/contrast.test.ts`, `lib/brand-assets.test.ts`, `components/*.test.tsx`, `app/**/page.test.tsx`, `next.config.test.ts`
- [ ] `apps/web/e2e/identidade.spec.ts` e `e2e/status.spec.ts` (era `home.spec.ts`); `playwright.config.ts` com o projeto `mobile` e `reducedMotion: 'reduce'`
- [ ] `include` do `vitest.config.ts` aceitando `.tsx`
- [ ] `apps/web/tsconfig.json` com `paths` (`@/*`)
- [ ] Framework: nada a instalar (Vitest e Playwright já existem)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Direção visual escolhida nos mockups e registrada antes da primeira tela | VIS-04 (critério 1) | Julgamento do autor | Autor compara as 3 direções no celular e no PC; a escolha fica registrada e commitada antes de qualquer tarefa de tela |
| Texto de Sobre, Regras e Privacidade | UX-03 | Revisão de conteúdo pelo autor | Autor lê as três páginas e aprova (Regras dependem do texto do Discord, D-13) |
| Preview do link no Discord e no WhatsApp | VIS-02 | Depende do crawler de cada app | Após o deploy, colar o link num chat e conferir a imagem 1200x630 |
| Aparência num celular real | UX-01 | Viewport emulado não cobre tudo | Abrir o site no celular nos dois temas |
| Legibilidade sobre texturas e gradientes | VIS-01 | O axe não avalia contraste sobre imagem | Conferir capa e rodapé nos dois temas |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
