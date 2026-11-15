# Phase 1: Esqueleto no ar com testes e CI - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-11-15
**Phase:** 01-esqueleto-no-ar-com-testes-e-ci
**Areas discussed:** Hospedagem, região e domínio; Repo, portões e deploy

---

## Hospedagem, região e domínio

### Região home da Oracle
| Option | Description | Selected |
|--------|-------------|----------|
| São Paulo | Junto do Supabase sa-east-1 e Vercel gru1 | |
| Vinhedo | Perto de SP; possivelmente menos disputa por ARM | ✓ (depois anulado) |
| Já tenho tenancy | Conta já existe | |

### Subdomínio gratuito para HTTPS
| Option | Description | Selected |
|--------|-------------|----------|
| DuckDNS | Subdomínio estável, na PSL | ✓ (depois anulado) |
| sslip.io / nip.io | Hostname derivado do IP | |
| Domínio pago | ~US$ 10/ano, quebra o custo zero | |

### Plano B
| Option | Description | Selected |
|--------|-------------|----------|
| Pesquisar e decidir | Pesquisador confere termos atuais | ✓ |
| Render | Hiberna, cold start | |
| Koyeb | Free tier atual não confirmado | |

### Contas existentes
**User's choice:** GitHub, Supabase (sem projeto), Vercel + texto livre: "Vamos usar Render ou Koyeb gratuito para a API em vez da Oracle, pois a Oracle exige CNPJ."
**Notes:** A Oracle foi descartada, o que anula a escolha de Vinhedo e do DuckDNS/Caddy.

### Hibernação no plano free
| Option | Description | Selected |
|--------|-------------|----------|
| Manter acordada com ping | Monitor de uptime a cada 5 a 10 min | |
| Aceitar o sono e projetar para isso | Crons no GitHub Actions e fallback no Next | |
| Pesquisar e decidir | Pesquisador recomenda | ✓ |

### Região do projeto Supabase
**User's choice:** "Ainda não criei, você pode me recomendar a melhor opção."
**Notes:** Recomendação: criar depois de definida a região da API, no mesmo lugar (us-east-1 se for o Render na Virginia).

### Colocação Vercel + API + banco
| Option | Description | Selected |
|--------|-------------|----------|
| Tudo junto nos EUA-Leste | Render Virginia/Ohio, Supabase us-east-1, Vercel iad1 | |
| Banco em São Paulo | ~120 ms por query entre API e banco | |
| Pesquisar e decidir | Pesquisador estima e recomenda | ✓ |

### Papel de cada plataforma
| Option | Description | Selected |
|--------|-------------|----------|
| Pesquisar e decidir | Pesquisador define primário e plano B | ✓ |
| Render primário, Koyeb plano B | | |
| Koyeb primário, Render plano B | | |

---

## Repo, portões e deploy

### Visibilidade do repo
| Option | Description | Selected |
|--------|-------------|----------|
| Público | Proteção da main grátis, Actions ilimitado, portfólio; exige varredura de segredos | ✓ |
| Privado | Proteção da main exige GitHub Pro | |

### Fluxo de branches
| Option | Description | Selected |
|--------|-------------|----------|
| Branch por fase + PR | `gsd/phase-N-slug`, branching_strategy=phase, master→main | ✓ |
| Branch por plano + PR | PRs menores | |
| Push direto na main | Sem proteção real | |

### Escopo do pre-push
| Option | Description | Selected |
|--------|-------------|----------|
| Lint+typecheck+unit+integração | Postgres via docker compose; E2E só na CI | ✓ |
| Só lint+typecheck+unit | Sem Docker local | |
| Suíte completa com E2E | Lento | |

### Deploy
| Option | Description | Selected |
|--------|-------------|----------|
| Automático no merge | Vercel Git + GHCR + deploy hook; previews por PR | ✓ |
| Web automático, API manual | | |
| Tudo manual | | |

---

## Claude's Discretion

- ORM (Prisma 7.10.1, conforme a pesquisa). O autor não quis discutir.
- Backup noturno e keep-alive (GitHub Actions, dump criptografado, destino privado). O autor não quis discutir.
- Ferramenta do hook, conteúdo da página do esqueleto, migration baseline, checagem de HTML bruto, previews da Vercel e Sentry.

## Deferred Ideas

- Risco de memória do `sharp` em ~512 MB (Fase 5).
- Jobs e crons com API hibernável (Fase 4).
