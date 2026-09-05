# Progresso — X-Flow

_Última atualização: 05/09/2026. Ficheiro de continuação de sessão — dizer ao agente: "Lê progresso.md e continua"._

## Estado do projeto
- X-Flow: CRM/OS para oficina PPF/wrap (Next.js 16.3.3, React 19.2.8, TS strict, Tailwind v4, base de dados Neon Postgres ligada)
- Health: typecheck OK, lint OK, 85/85 testes a passar
- **Git a funcionar**: repo inicializado, commit inicial `5e3c471` no `main` e push feito para `https://github.com/Zurcluis/x_flow.git` (remote `origin`, tracking ativo)
- `README.md` ainda é o template default do create-next-app
- Fonte de verdade do produto: `X-Flow_AntiGravity_Master_Blueprint.md` + ADRs em `docs/adr/`

## Base de dados (Neon, 05/09/2026)
- **Neon Postgres 18.6** ligado e **10/10 migrações aplicadas** (35 tabelas em `public`) — migrações eram SQL puro, sem dependências Supabase
- Connection string (pooler) em `.env.local` como `DATABASE_URL` — coberto por `.env*` no `.gitignore` (não commitar)
- `pg` instalado com `--no-save` (apenas para o runner de migrações) — decidir cliente/ORM definitivo na integração
- **Pendente**: app ainda usa demo data (`src/lib/demo-data`) — ligar queries às tabelas; migrations são de `supabase/migrations` (manter pasta ou renomear)

## O que foi feito na sessão 04/09/2026 (mudanças visuais)
1. **Piso tipográfico subido** (83 ficheiros): `9px/10px → 11px` (badges/eyebrows), `11px → 12px` (metadados). Zero texto abaixo de 11px.
2. **Muted clareado para WCAG AA**: `#747a7c` → `#8a9092` em todo o src (incl. `--text-muted` em `src/styles/tokens.css`). Contraste: 4.28:1 → 5.76:1.
3. **Dourado reduzido de 102 → 50 elementos no dashboard** (neutro em links "Ver…", ícones de quick actions e search; dourado mantido em CTA primário, nav ativa, IA, badges, gráficos).

## O que foi feito na sessão 05/09/2026 (pendentes do ponto 4 do audit, exceto médio prazo)
1. **Typo corrigido**: `AlertCard.tsx` — "Ver todas as alertas" → "Ver todos os alertas".
2. **Escala tipográfica intermédia (20/24px)**: itens 16px → cards 20px (`CardTitle` em `ui/card.tsx`, agora `text-xl`) → secções 24px (h2/h3 de secção nas páginas de listagem/detalhe, design-system, certificado público) → páginas 24/30px (h1 de detalhe subidos de `text-xl` para `text-2xl`). Usos de `CardTitle` com `text-base` explícito removidos (WorkOrderRow, AgendaTimeline, AlertCard).
3. **Sidebar agrupada em secções** (`src/components/xflow/Sidebar.tsx`): top-level (Centro de Comando, O Meu Dia) + Operação / Negócio / Gestão / Sistema, com labels (11px uppercase) e divisores; scroll (`overflow-y-auto`) na nav. Ícones duplicados resolvidos: Produção=`Layers`, Vision=`ScanSearch`, Simulador 3D=`Box`, Design System=`Palette`. `MAIN_NAV`/`NAV_SECTIONS` exportados e reutilizados no drawer mobile (`AppShell.tsx`) — desduplicação (drawer passava a incluir Faturação; Check-in alinhado com `ClipboardCheck`).
4. **Consistência**:
   - Topbar movida para o layout (`AppShell.tsx`, visível ≥lg): pesquisa ⌘K, IA, ações rápidas, notificações e perfil ficam globais; `Topbar.tsx` é agora chrome-only (dados de perfil vêm de `initialDashboardData`); dashboard tem bloco de título próprio; `page.tsx` deixou de renderizar Topbar.
   - `--shadow-card` agora usado no `Card` (`shadow-[var(--shadow-card)]` em `ui/card.tsx` — a forma `shadow-(--var)` não compila neste setup).
   - Raios alinhados com tokens (`@theme` em `globals.css`): `rounded-[16px]` → `rounded-lg` (18px) em 20 ficheiros; `rounded-[9px]` → `rounded-sm` (10px) em chips/toggles.
5. **`@media print` claro** (globals.css): classe `.print-light` (fundo branco, tinta `#1a1d1e`, sem sombras/gradientes, bordas escuras) aplicada a `/warranties/certificate/[token]` e `/qc/certificate/[certificateNumber]`; botão "Partilhar Certificado" com `.no-print`.
6. Verificação no browser (dev server): sidebar com secções e colapso (80px), topbar global nas páginas, h1 30px, CardTitle 20px, radius 18px, shadow token, certificado com classes print. Validação: typecheck, lint e 85/85 testes OK.

## Pendente
- **Médio prazo**: ligar a app às tabelas Neon (substituir demo data), README real
- H1s de listagem misturam `text-2xl` e `text-2xl lg:text-3xl` — unificar noutro pass
- Raios `rounded-[8px]/[10px]/[12px]/[14px]` existem fora dos tokens — mapear para `rounded-sm/md` noutro pass
- Topbar chrome não aparece em <lg (mobile tem header/drawer/bottom-nav próprios) — avaliar ações rápidas no drawer mobile
- Filtro `pathname.startsWith(item.href)` na nav pode dar falsos positivos futuros (ex.: `/tools` vs `/tooling`) — considerar `route matching` por segmentos

## Notas práticas
- Dev server: `npm run dev` em `localhost:3000` (não está a correr entre sessões).
- Mudanças **não commitadas** (não há git). Se quiseres preservar: `git init` + commit antes de mais nada.

## Retomar
Dizer ao agente: "Lê `progresso.md` e continua pelos pendentes."
