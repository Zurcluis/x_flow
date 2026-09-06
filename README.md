# X-Flow

CRM/OS para oficina PPF & wrapping — centro de comando, check-ins fotográficos com mapa de danos,
orçamentos com portal público, produção em kanban, agenda de baias, stock, faturação, garantias,
simulador de acabamentos e painel de oficina para TV.

## Stack

- **Next.js 16** (App Router, server actions, `force-dynamic`) + **React 19** + **TypeScript strict**
- **Tailwind CSS v4** (tokens em `src/app/globals.css` e `src/styles/tokens.css`)
- **Postgres (Neon)** com repositórios SQL puros em `src/server/*.ts` (snake_case → camelCase)
- **Vitest** + Testing Library (85 testes)

## Arranque

```bash
npm install
npm run dev          # http://localhost:3000
```

A `DATABASE_URL` (connection string com pooler da Neon) vive em `.env.local` — nunca commitar.

## Base de dados

```bash
node scripts/migrate.mjs        # aplica migrações estruturais pendentes (idempotente)
node scripts/seed.mjs           # seed global demo (idempotente — truncate antes: node scripts/reset.mjs)
node scripts/seed-films.mjs     # catálogo de películas p/ simulador (idempotente, ON CONFLICT)
```

- Migrações em `supabase/migrations/` (numeradas 202608280000NN).
- RLS por organização ativa (`current_organization_id()`); em dev a RLS é bypassed pelo owner — rever quando existir auth.

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | dev server em localhost:3000 |
| `npm run build` / `npm start` | produção |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest (run única) |

## Estrutura

```
src/
  app/            # páginas (App Router); views client-side junto do page.tsx
    actions/      # server actions por domínio
  server/         # repositórios pg por domínio (única fonte de SQL)
  components/     # ui/ (primitivas) + xflow/ (domínio)
  domains/        # tipos por domínio + lógica determinística (intelligence/)
  lib/            # db, formatting, film-simulation (motor físico do simulador)
scripts/          # migrate.mjs, seed.mjs, seed-films.mjs, reset.mjs
supabase/migrations/
```

## Padrões

- Página server (`force-dynamic`) → repositório `src/server/<domínio>.ts` → view client.
- Escritas via server actions em `src/app/actions/<domínio>.ts` com `revalidatePath`.
- Simulador: tabela `films` (GU, metallic, flake) alimenta o motor `src/lib/film-simulation.ts`
  (composição por pixel com preservação de luminância sobre a foto real do check-in).

## Fonte de verdade de produto

`X-Flow_AntiGravity_Master_Blueprint.md` + ADRs em `docs/adr/`. Estado e continuação de sessão:
`progresso.md`.
