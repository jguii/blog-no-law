---
phase: 02-identidade-visual-no-law
plan: 02
subsystem: ui
tags: [conteudo, copy, vitest, tdd, pt-br]

requires:
  - phase: 01-esqueleto-no-ar-com-testes-e-ci
    provides: projeto de teste `unit` do apps/web (lib/**/*.test.ts) e Prettier no CI
provides:
  - "apps/web/lib/conteudo.ts: SOBRE, REGRAS, REGRAS_PROVISORIAS e PRIVACIDADE (dados puros, tipados)"
  - "apps/web/lib/conteudo.test.ts: contrato dos textos (cópia exata, nada de lei, rastreador, contato pessoal ou marcação)"
affects: [02-06, 02-09]

actuals:
  tokens: 2700
  tasks: 3
  commits: 4

plan_head_before: 27d761110c052feb5931e55a535d0700781eaec7
plan_head_after: fd3e697ce86528fb2fb67d5b1f185c61f643a731

tech-stack:
  added: []
  patterns:
    - "Textos institucionais como dados puros em lib/conteudo.ts, renderizados como texto pelo JSX (nunca HTML)"
    - "Varredura de todas as strings dos exports por termos proibidos (helper coletarTextos)"

key-files:
  created:
    - apps/web/lib/conteudo.ts
    - apps/web/lib/conteudo.test.ts
  modified: []

key-decisions:
  - "Sobre usa o texto do autor, sem 'A história completa chega em breve.', dividido em dois parágrafos (uma frase cada), palavra por palavra como enviado"
  - "Regras adaptadas em 3 grupos e 8 regras, REGRAS_PROVISORIAS é derivado de REGRAS.grupos.length === 0 (nunca fica fora de sincronia)"
  - "O agradecimento final do texto do Discord entrou na introdução e o 'jogar de boa' na última regra, porque a forma REGRAS (titulo, introducao, grupos) é contrato com o 02-06 e não ganhou campo novo"

patterns-established:
  - "Asserções de teste de texto comparam strings de uma linha (umaLinha), para o relatório TAP não ter dados multilinha"

requirements-completed: [UX-03]

coverage:
  - id: D1
    description: "Sobre o clã com o texto do autor, sem a frase provisória"
    requirement: UX-03
    verification:
      - kind: unit
        ref: "apps/web/lib/conteudo.test.ts#Sobre: os parágrafos são exatamente o texto do autor"
        status: pass
    human_judgment: false
  - id: D2
    description: "Regras do Discord adaptadas ao blog: 3 grupos, 8 regras, sentido mantido"
    requirement: UX-03
    verification:
      - kind: unit
        ref: "apps/web/lib/conteudo.test.ts#Regras: a adaptação do Discord tem 3 grupos e 8 regras"
        status: pass
      - kind: unit
        ref: "apps/web/lib/conteudo.test.ts#Regras: o sentido das regras do Discord se mantém (D-13)"
        status: pass
    human_judgment: true
    rationale: "O teste checa que as ideias-chave continuam presentes, mas fidelidade de sentido e de tom é julgamento do autor"
  - id: D3
    description: "Política de Privacidade sem lei, sem 'não coleta/não compartilha', só o que o site guarda"
    requirement: UX-03
    verification:
      - kind: unit
        ref: "apps/web/lib/conteudo.test.ts#nenhum texto contém (varredura it.each) e Privacidade: *"
        status: pass
    human_judgment: false

duration: 25min
completed: 2026-11-27
status: complete
---

# Phase 02 Plan 02: Textos institucionais Summary

**Textos de Sobre o clã (texto do autor), Regras (adaptadas do Discord em 3 grupos e 8 regras) e Política de Privacidade (sem citar lei) como dados tipados em `lib/conteudo.ts`, com teste de contrato que varre todas as strings.**

## Performance

- **Duration:** cerca de 25 min
- **Tasks:** 3 (Task 2 foi checkpoint de conteúdo, respondido pelo autor antes da execução)
- **Files modified:** 2 (ambos novos)

## Accomplishments

- `lib/conteudo.ts` exporta `SOBRE`, `REGRAS`, `REGRAS_PROVISORIAS`, `PRIVACIDADE` e os tipos `Secao` e `GrupoDeRegras`, sem importar nada, na forma exata de `<interfaces>` do plano.
- Teste de contrato com 24 casos: cópia exata de Sobre, Privacidade (D-14/P7) e estrutura das Regras, mais varredura de todas as strings contra `lgpd`, "lei", "cookie", "não coleta", "não compartilha", `<`, `http`, `www.`, `discord.gg`, menção `@letra`, e-mail e telefone.
- Guarda D-05 intacta: `PROJECT.md` mantém "em 2017, de uma amizade de mais de 10 anos" e não tem "10+ anos" (`D05_OK`).

## Resposta do autor (Task 2, D-13)

Task 2 foi um `checkpoint:human-action` apresentado pelo orquestrador antes do despacho; sem código e sem commit.

1. **Regras:** o autor enviou o texto e pediu para criar as regras a partir dele. Resultado: **regras adaptadas: 3 grupos, 8 regras** (`REGRAS_PROVISORIAS = false`).
   - "Respeito vem primeiro" (1 regra)
   - "Preconceito e piadas" (4 regras: preconceito, piada sexual, "era brincadeira" não vale, banimento do clã e do Discord)
   - "Desentendimentos e brigas" (3 regras: resolver na conversa e com calma, sem briga no chat com mensagem apagada, "é apenas SA-MP")
   - Introdução de 2 frases (ideia simples da No Law, respeito acima de tudo, agradecimento). Sem caixa alta, sem emoji, sem menção, convite ou link.
2. **Sobre o clã:** o autor **substituiu** o texto provisório e escolheu **não** manter "A história completa chega em breve.". `SOBRE.paragrafos` é exatamente o texto dele, em dois parágrafos (uma frase cada), mantendo "A No Law" no feminino. **Não** foi acrescentada a vírgula antes de "no servidor": o plano só autorizava se fosse erro claro, e a frase se lê bem como está. O teste de Sobre continua exigindo "2017" e "SA-MP" e agora também proíbe "chega em breve".
3. **Política de Privacidade:** "Textos ok", sem mudança.

## Task Commits

1. **Task 1 (tracer, TDD) RED** - `84df178` (test): contrato dos textos, com esqueleto de `conteudo.ts` para falhar em asserção
2. **Task 1 GREEN** - `9f7b263` (feat): textos de Sobre, Regras mínimas e Privacidade
3. **Task 2** - sem commit (checkpoint de conteúdo do autor)
4. **Task 3 RED** - `ba42a8f` (test): expectativa das regras adaptadas e do Sobre do autor
5. **Task 3 GREEN** - `fd3e697` (feat): regras adaptadas e Sobre do autor

**Plan metadata:** commit `docs(02-02)` com este SUMMARY (STATE.md e ROADMAP.md ficam com o orquestrador).

## TDD Gate Compliance

- **RED 1:** alvo `Sobre: os parágrafos são o texto provisório da UI-SPEC`; falhou em asserção (`expected '' to be 'O No Law nasceu em 2017...'`), 8 de 20 testes falhando por conteúdo vazio no esqueleto. `gsd_run check tdd-red-evidence` devolveu `RED_EVIDENCE_OK` (TAP, `tap-flat`). Avaliação semântica: o teste alvo executou e falhou pelo motivo previsto (texto ausente), sem erro de carga, import ou fixture.
- **RED 2:** alvo `Regras: a adaptação do Discord tem 3 grupos e 8 regras e deixa de ser provisória`; falhou em asserção (grupos vazios, `REGRAS_PROVISORIAS` falso na esperada), junto com Sobre exato e "sentido das regras". `RED_EVIDENCE_OK`. Avaliação semântica: falha na estrutura planejada, pelo motivo certo.
- **GREEN:** 20/20 e depois 24/24 passando; `prettier --check` limpo; `pnpm run format:check` verde.
- **Gate de ordem:** os dois `test(02-02)` precedem seus `feat(02-02)`. Sem REFACTOR (nada a limpar).
- **Tracer gate:** verificação automatizada de Task 1 re-executada após o GREEN e verde antes da expansão.

## Files Created/Modified

- `apps/web/lib/conteudo.ts` - Sobre, Regras, REGRAS_PROVISORIAS e Privacidade como dados puros
- `apps/web/lib/conteudo.test.ts` - contrato dos textos e varredura de termos proibidos

## Decisions Made

- Sobre em dois parágrafos, um por frase, com o texto do autor intacto.
- `REGRAS_PROVISORIAS` é calculado a partir de `REGRAS.grupos.length === 0`, em vez de constante solta.
- O agradecimento final do Discord virou segunda frase da introdução e o "jogar de boa" virou fim da última regra, sem campo novo em `REGRAS` (contrato com o 02-06).
- Regra "Quem fizer isso é banido do clã e do nosso Discord." ficou como item próprio dentro de "Preconceito e piadas", porque "isso" no original se refere a preconceito e piada sexual.

## Deviations from Plan

None - plan executed exactly as written. Duas mudanças pedidas pelo autor foram aplicadas como o plano previa (Task 3 permitia ajustar Sobre e o teste junto): o Sobre foi trocado e o teste de cópia exata de Sobre atualizado na mesma tarefa.

Ajuste de ferramenta (não de escopo): as asserções de lista usam `umaLinha(...)` (strings de uma linha) porque o relatório TAP com arrays multilinha era recusado pelo classificador de RED (`Non-TAP data in report`).

## Issues Encountered

- `pnpm --filter @blog/web test -- lib/conteudo.test.ts` roda a suíte inteira do projeto `unit`; `api.test.ts` falha neste worktree porque `@blog/shared` não tem `dist` construído (limitação do bootstrap do worktree, fora do escopo; não afeta este plano). O alvo foi rodado com `pnpm --filter @blog/web exec vitest run --project unit lib/conteudo.test.ts`.

## Known Stubs

None. `REGRAS.grupos` vazio (versão provisória) deixou de existir: as regras reais estão no lugar.

## Threat Flags

None - sem novo endpoint, caminho de autenticação ou acesso a arquivo. T-02-04/05/06 mitigadas pela varredura do teste (contato, menção, convite, `<`, `http`, `www.`, "não coleta/compartilha", lei e "cookie").

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- O 02-06 pode importar `SOBRE`, `REGRAS`, `REGRAS_PROVISORIAS` e `PRIVACIDADE` e renderizar `h1`, `h2` por grupo, `ol` por regras e `ul` na Privacidade, sempre como texto.
- A revisão final dos textos pelo autor continua como item manual do 02-09; o Sobre já é o texto dele, mas pode crescer (história completa).

## Self-Check: PASSED

- `apps/web/lib/conteudo.ts` e `apps/web/lib/conteudo.test.ts` existem.
- Commits `84df178`, `9f7b263`, `ba42a8f` e `fd3e697` são ancestrais de HEAD.
- Critérios de aceite: sem `lgpd`/`cookie` em conteudo.ts, sem `discord.gg`/`@everyone`/`@here`, "Fale com um admin do clã" presente, `test(02-02)` antes de `feat(02-02)` nas duas tarefas, `D05_OK`.

---
*Phase: 02-identidade-visual-no-law*
*Completed: 2026-11-27*
