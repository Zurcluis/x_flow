# X-Flow by X-Motion

**Operating System Automóvel** — CRM e sistema operativo para oficinas de PPF, wrap/vinil, Color PPF e chrome delete. A unidade central é a viatura: cada viatura torna-se num processo digital rastreável, do primeiro contacto até à garantia e fidelização.

## Estado do projeto

MVP interno em desenvolvimento ativo. Última validação: typecheck OK, lint OK, 92/92 testes.

**Ligado à BD (leitura e escritas reais):** dashboard (KPIs + alertas determinísticos), clientes (listar/criar/detalhe), viaturas + passaporte digital, orçamentos (emitir, aprovar — cria ordem de trabalho draft com 8 fases —, refazer, eliminar; portal do cliente por token), produção (kanban, fases, checklist, timesheet, progresso recalculado), agenda/calendário (baias, conflitos, mapa 3D da oficina), check-ins fotográficos (fotos, mapa de danos sobre a foto, pertences), entregas (gate QC, checklist, assinatura), O Meu Dia, pesquisa global (⌘K), equipa, Time Book, relatórios, painel de oficina para TV (`/shop-floor`) e simulador (catálogo `films` da BD + estúdio 3D three.js + simulação sobre foto real).

**Leitura ligada à BD, escritas ainda demo:** faturas, garantias, stock, ferramentas, B2B.

**Demo data:** `/vision` (análise IA), `/qc/certificate/[n]` e `/passport/[plate]` (reescritas pendentes). Fotos de check-in guardadas como data URL (TEXT) — migrar para object storage.

## Stack

- **Next.js 16.3.3** — App Router, server actions, guarda de sessão em `src/proxy.ts`
- **React 19** + **TypeScript strict**
- **Tailwind CSS v4** — tokens em `src/app/globals.css` e `src/styles/tokens.css`
- **Postgres (Neon)** via `pg` — repositórios SQL puros, RLS por organização
- **three.js** + `@react-three/fiber` + `drei` — estúdio 3D do simulador
- **@mediapipe/tasks-vision** — segmentação de viatura (DeepLab v3) no browser
- **Vitest** + Testing Library (jsdom) — 92 testes
- **ESLint 9** (`eslint-config-next`), `lucide-react`, `clsx`, `tailwind-merge`

## Pré-requisitos

- Node.js >= 20.9.0 (requisito do Next.js 16)
- Base de dados Neon Postgres: connection string (pooler) em `.env.local` como `DATABASE_URL` — nunca commitar

## Setup

```bash
npm install
node scripts/migrate.mjs         # 1. migrações estruturais (idempotente)
node scripts/seed.mjs            # 2. seed demo global (idempotente)
node scripts/seed-films.mjs      # 3. catálogo de películas (substitui o da org)
node scripts/create-db-role.mjs  # 4. role não-owner para RLS efetiva
npm run dev                      # http://localhost:3000 -> /login
```

O `create-db-role.mjs` cria a role **não-owner** `xflow_app` (grants nas tabelas e sequências, incluindo default privileges para tabelas futuras) e grava `DATABASE_URL_APP` em `.env.local` com **ligação direta, sem pooler** — necessário porque as variáveis de sessão (GUC) da RLS não sobrevivem ao pooling transacional. O pool da app (`src/lib/db.ts`) prefere `DATABASE_URL_APP` e fixa a organização por ligação via GUC `app.current_organization_id`.

## Autenticação

- Sessões próprias: tabela `auth_sessions` (token aleatório de 32 bytes, guardado como hash SHA-256), cookie `xflow_session` httpOnly com 30 dias; o logout revoga a sessão.
- Passwords com scrypt (N=16384, r=8, p=1) em `profiles.password_hash`; rate limit de login (10 tentativas/15 min por IP + email).
- RLS por organização: o GUC `app.current_organization_id` é fixado por ligação (bootstrap) e atualizado com a organização da sessão em cada pedido. Com o owner (`DATABASE_URL`) a RLS é bypassed — a role não-owner é a que a aplica de facto.
- O papel define a visibilidade financeira: admin e workshop_manager veem margens; technician não.

Credenciais demo (password `xflow-demo-2026`):

| Email | Papel |
| --- | --- |
| `patricia@xmotion.pt` | workshop_manager |
| `joao@xmotion.pt`, `ricardo@xmotion.pt`, `miguel@xmotion.pt` | technician |

O admin `luis@xmotion.pt` tem password pessoal definida via `node scripts/set-password.mjs luis@xmotion.pt` (password passada na env `XFLOW_PASSWORD`).

## Scripts

| Comando | Descrição |
| --- | --- |
| `node scripts/migrate.mjs` | Aplica migrações estruturais pendentes (deteção de colunas/tabelas/políticas); backfill de passwords demo |
| `node scripts/seed.mjs` | Seed global demo: org, equipa, baias, catálogo, materiais, clientes, viaturas, orçamentos, ordens com fases/tempos, check-ins, QC, agenda, faturas, garantia+entrega. Ignora se a org `x-motion` já existir |
| `node scripts/reset.mjs` | Truncate de todas as tabelas públicas (destrutivo — usar antes do seed para regenerar) |
| `node scripts/seed-films.mjs` | Catálogo de películas — 245 (100 3M 1080 + 136 Avery SWF + 9 curadas XPEL/Stek/Inozetek/KPMF); DELETE+INSERT, substitui o catálogo da org |
| `node scripts/create-db-role.mjs` | Cria a role `xflow_app` (não-owner) e grava `DATABASE_URL_APP` (ligação direta) em `.env.local` |
| `node scripts/verify-rls.mjs` | Verifica RLS efetiva: role, políticas, GUC da organização, fluxo por token |
| `node scripts/parse-3m-catalog.mjs` | Extrai 100 cores do colour card 3M 1080 (`public/catalogos/3M.pdf`) para `scripts/catalog-data/3m-1080.json` |
| `node scripts/parse-avery-catalog.mjs` | Extrai 136 cores da colour card Avery SW900 2026 (`public/catalogos/Avery.pdf`) para `scripts/catalog-data/avery-sw900.json` |
| `node scripts/auth-crypto.mjs` | Módulo partilhado (scrypt, hash/verify) usado pelos scripts de seed/migração |

## Testes

```bash
npm run test         # Vitest (jsdom) — 92 testes em 24 ficheiros
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint 9 + eslint-config-next
```

## Arquitectura

- Padrão por domínio: `src/server/<domínio>.ts` (repositório `pg`, SQL puro, snake_case -> camelCase) + `src/app/actions/<domínio>.ts` (server actions com `revalidatePath`) + página server (`force-dynamic`) -> view client.
- `src/lib/db.ts` — pool `pg` (max 8); prefere `DATABASE_URL_APP` e fixa o GUC da organização em cada ligação.
- `src/proxy.ts` — guarda de sessão: redireciona para `/login` sem cookie; rotas públicas por token: `/portal/`, `/quotes/public/`, `/checkins/report/`, `/qc/certificate/`, `/warranties/certificate/`.
- `supabase/migrations/` — 19 migrações SQL numeradas `202608280000NN` (40 tabelas).
- Simulador: `src/lib/film-simulation.ts` (composição física por pixel), `src/lib/car-segmentation.ts` (MediaPipe), `src/lib/car-models.ts` + `CarStudio3D.tsx` (three.js).

## Roadmap / continuar

- Fonte de verdade do produto: `X-Flow_AntiGravity_Master_Blueprint.md` + ADRs em `docs/adr/`.
- Estado e pendentes por sessão: `progresso.md`.
- Para retomar o trabalho: **"Lê progresso.md e continua."**
