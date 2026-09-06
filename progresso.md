# Progresso — X-Flow

_Última atualização: 06/09/2026 (noite). Ficheiro de continuação de sessão — dizer ao agente: "Lê progresso.md e continua"._

## Estado do projeto
- X-Flow: CRM/OS para oficina PPF/wrap (Next.js 16.3.3, React 19.2.8, TS strict, Tailwind v4, base de dados Neon Postgres ligada)
- Health: typecheck OK, lint OK, 85/85 testes a passar
- **Git a funcionar**: repo em `main`, tudo commitado e pushed para `https://github.com/Zurcluis/x_flow.git` (remote `origin`, tracking ativo)
- `README.md` ainda é o template default do create-next-app
- Fonte de verdade do produto: `X-Flow_AntiGravity_Master_Blueprint.md` + ADRs em `docs/adr/`
- Feed de progresso: `progresso.md` (este ficheiro)

## Base de dados (Neon, 06/09/2026)
- **Neon Postgres 18.6** ligado e **15 migrações aplicadas** (35+ tabelas; 15: tabela `films` + `deliveries.belongings` JSONB)
- Connection string (pooler) em `.env.local` como `DATABASE_URL` — coberto por `.env*` no `.gitignore` (não commitar)
- **Seed global**: `node scripts/seed.mjs` (idempotente, truncate manual antes) — org, 5 perfis, 3 baias, catálogo, 6 materiais (3 críticos), 5 clientes, 6 viaturas, 5 orçamentos, 4 ordens com fases/tempos, check-ins, QC, agenda da semana, faturas, garantia+entrega
- **Seed de películas**: `node scripts/seed-films.mjs` (idempotente, ON CONFLICT) — 15 películas reais (3M 2080, Avery SW900, XPEL Ultimate/Stealth, Stek DYNO, Inozetek, KPMF) com cor, GU, metallic, flake, custo/m e garantia
- **Migrações estruturais novas**: `node scripts/migrate.mjs` (idempotente por deteção de colunas/tabelas)

## Sessão 06/09 (noite) — Películas físicas no simulador + entregas reais (validado E2E)
- **Migração 15**: `films` (catálogo com parâmetros físicos: `gloss_gu`, `metallic`, `flake_scale`, `cost_per_meter_cents`, `warranty_years`, type clear_ppf_gloss/clear_ppf_matte/color_ppf/vinyl_wrap/chrome_delete) + `deliveries.belongings` JSONB
- **Simulação física em canvas** (`src/lib/film-simulation.ts`): composição por pixel sobre a foto real que preserva a luminância (sombras/reflexos/vãos), modelo difusão (cor do filme × shading) + especular derivada do GU + sparkle determinístico de flocos metálicos; PPF transparente preserva croma e aplica só o modelo de brilho; auto-exposição pela mediana; max 1200px, JPEG 0.92
- **Simulador** (`/simulator`): presets agora vêm da tabela `films` via `listFilms()` (fallback demo data se vazia); badge mostra "Efeito X · N GU"; resultado canvas no lado "Simulado" do slider com fallback CSS + indicador "a processar simulação física…" enquanto processa; FinishSelector mostra GU; carbon continua overlay CSS
- **Entregas reais** (`/deliveries/new`): página server com candidatos da BD (`listDeliveryCandidates` — OTs `completed` sem entrega, LEFT JOIN QC passed, pertences do último check-in da viatura); `NewDeliveryWizard` 3 passos (gate QC → checklist de pertences pré-preenchido → assinatura + notas); `createDeliveryAction`/`createDelivery` gravam em transação com token público; estado vazio com explicação
- **Bug apanhado no E2E**: SELECT não aliava `qc.certificate_number AS qc_certificate_number` — o gate de QC aparecia sempre "sem registo"; corrigido e revalidado (badge "QC 100% Aprovado" com QC-2026-44TX88-PASS)
- **Pass de raios para tokens** (~80 ficheiros): `rounded-[8px]→rounded-sm(10px)`, `[10px]→rounded-sm`, `[12px]→rounded-md`, `[14px]→rounded-md`, `[18px]→rounded-lg` fora dos tokens eliminados (pendente do audit de 05/09)
- Validação: typecheck, lint, 85/85 testes; E2E no browser — simulador gera JPEG simulado distinto do original (data URL) e re-simula ao trocar de película; entrega registada para WO-2026-098 (Ferrari UV-12-WX, pertences, assinatura demo, notas) persistida em `deliveries.belongings` JSONB e visível na ficha `/deliveries/[id]`

## Ainda por ligar (usa demo data)
- `/vision` (fase 8 do blueprint — análise IA), `/qc/certificate/[n]` e `/passport/[plate]` (reescritas de corpo completo), auth/perfis, RLS efetiva (owner faz bypass); RLS atualmente bypassed (owner) — rever políticas na altura do auth
- Fotos de check-in guardadas como data URL na BD (TEXT) — migrar para object storage quando existir auth/Storage
- Faturas/garantias/stock/ferramentas/B2B: leitura ligada à BD, escritas ainda demo (entregas agora com escrita real)

## Núcleo operacional interligado (05/09/2026, commit 1f53194)
- **Padrão estabelecido**: `src/server/<domínio>.ts` (repositório pg, snake→camel) + `src/app/actions/<domínio>.ts` (server actions) + página server (`force-dynamic`) → view client
- **Ligados à BD**: dashboard (KPIs reais + intelligence alerts determinísticos), clientes (listar/criar), viaturas + passaporte/timeline (listar/criar/detalhe), orçamentos (listar/detalhe/aprovar→cria WO draft com 8 fases), produção (kanban + painel da obra: fases, checklist, timesheet, progresso recalculado), agenda (semana + baias, capacidade determinística), stock (materiais/lotões/críticos), o meu dia (tarefa ativa do técnico + marcações do dia)
- **Pesquisa global (⌘K)** consulta a BD em tempo real (clientes, viaturas, orçamentos, produção, stock)
- **Interconexões funcionais**: aprovar orçamento cria ordem de trabalho idempotente (migração 11: `work_orders.quote_id`); concluir fases recalcula progresso/horas e muda estado; QC in_rework e atrasos aparecem no dashboard
- Testado end-to-end no browser (aprovação Q-2026-017 → WO-2026-199 draft com 8 fases). Typecheck, lint, 85/85 testes OK

## Sessão 05/09 (tarde) — páginas ligadas à BD
- **Páginas ligadas à BD (leitura)**: faturas, entregas, garantias, ferramentas, equipa, B2B (+ detalhe), time-book (benchmarks reais por modelo/fase a partir de `work_order_time_entries` com confiança por amostras), relatórios (margens por serviço, receita trimestral, eficiência, scrap), detalhe de cliente (tabs), detalhe de check-in
- **Escritas**: nova viatura (também no detalhe do cliente), aprovação pública por token (`approvePublicQuoteAction`), produção (iniciar/concluir fases, checklist, timesheet)
- **Páginas públicas por token**: `/quotes/public/[token]` e `/checkins/report/[token]` servem dados reais; `/warranties/certificate/wty-2026-001` real
- **Simulator** lê viaturas reais; **pesquisa global** já na BD
- **Migração 12**: `tools` + `employees` (equipa); seed global regenerado com tooling, equipa, materiais com lotes, orçamentos com opções reais, ordens com fases/tempos, check-ins com danos, QC, agenda, faturas, garantia + entrega

## Sessão 05/09 (noite) — Calendário Google-like, Kanban e Equipa (commit 9e11bf3)
- **Calendário novo** (`CalendarEngine.tsx`): vistas Mês/Semana/Dia/Agenda; criar marcação clicando num slot (pré-preenchido com data/hora/baia); editar e cancelar ao clicar no evento; arrastar eventos entre dias/baias; conflitos detetados no servidor (baia/técnico/viatura) com opção "guardar mesmo assim"; cores por estado; navegação ‹ › Hoje
- **Kanban na produção**: 5 colunas (Rascunho → Em Curso → Aguardar Peças → QC → Concluído) com drag-and-drop entre estados (ação `updateWorkOrderStatusAction`, otimista + revalidate); toggle Kanban/Lista
- **Equipa**: modal "Adicionar Colaborador" (nome, função, especialidade, nível, estado, email, telefone, certificações) → tabela `employees`; migração 13 (employees.email/phone + employee_absences para futuro quadro de ausências)
- **Scripts**: `scripts/migrate.mjs` (aplica migrações estruturais pendentes, idempotente), `scripts/reset.mjs` (truncate)
- Validação: typecheck, lint 0 erros, 85/85 testes; testado no browser (criação de marcação e colaborador persistidas)
- **Nota**: horários do calendário são absolutos (UTC) e mostrados no fuso do browser

## Sessão 06/09/2026 — Check-in real, portal do cliente, painel de TV e simulador (7 commits, push feito)
- **Encoding cp850 corrigido** (3bbdb1f): NewQuoteView/NewCheckinView/SimulatorView tinham texto gravado em mojibake estilo codepage DOS (UTF-8 lido como cp850 e regravado); corrigido com script one-off que reverte a transformação. Ficheiros validados UTF-8 estrito.
- **Mapa 3D da oficina no calendário** (c1d5610): `WorkshopMap.tsx` — grelha de baias em perspetiva, drag & drop de viaturas para baias, CRUD de baias, cliente derivado do proprietário da viatura.
- **Check-in completo e persistido** (8c762c7 + 4d69b84): migração 14 (`checkin_damages.photo_id`, `checkins.belongings` JSONB, CHECK de angles alinhado com o domínio); `PhotoInspectionGrid` com upload real (compressão canvas 1600px/JPEG, fotos guardadas como data URL na BD); novo `PhotoDamageMapper` — danos marcados por clique **sobre a fotografia** (passo 4 depois das fotos); `createCheckinAction` grava check-in + fotos + danos + pertences em transação; ficha de detalhe e relatório público mostram danos na foto exata.
- **Viaturas** (2107291): causa raiz `String(null)="null"` no `currentOwner.customerId` (quebrava agendamento com `invalid input syntax for type uuid`); `createVehicleAction` agora lê o proprietário de `currentOwner` (formulário); capa com foto frontal (último check-in) nos cards; 00-GA-23 ligada a Miguel Cruz (reparação de dados).
- **Orçamentos emitidos de verdade** (7d780f4): `createQuote` (transação quote + 3 opções + itens + eventos, token público, expira 30d); "Emitir e Gerar Link Seguro" grava e redireciona para a ficha; **eliminar** (bloqueado se já gerou WO) e **refazer** (`/quotes/new?vehicle=` pré-seleciona); **portal do cliente dinâmico** `/portal/[token]` — proposta com 3 opções, aceitar (cria WO idempotente) ou recusar; links WhatsApp/copiar/"Ver como Cliente" apontam ao portal.
- **Painel de oficina para TV** (68a9e44): `/shop-floor` standalone (sem shell) — relógio live, 5 KPIs (marcações hoje, em produção, QC pendente, concluídas hoje, propostas à espera), agenda do dia, produção em curso com barras de progresso; auto-refresh 60s; link na sidebar (Sistema → Painel Oficina).
- **Simulador de acabamentos** (7b7c76a): simulação visual sobre a **foto real** da viatura (blend modes por textura: gloss/matte/satin/carbon), slider antes/depois, silhueta vetorial de fallback, aviso de representação (requisito blueprint); **estimativa determinística** (material por cobertura 14/17/21m + contraste, horas 24/30/36 + contraste/SUV, 33 €/h, preço ×2,5 com margem); zonas críticas em contraste alto; sincronização automática da cobertura recomendada; "Criar Orçamento com este Acabamento" leva vehicle+finish+coverage para `/quotes/new` com banner de referência.
- Validação: typecheck, lint 0 erros, testado E2E no browser (check-in 00-GA-23 com 6 fotos/3 danos; orçamento ORC-2026-997 emitido → aceite no portal → WO-2026-232 criada; marcação agendada; propostas eliminadas/bloqueadas conforme esperado).

## Ainda por ligar (usa demo data)
- `/vision` (fase 8 do blueprint — análise IA), `/qc/certificate/[n]` e `/passport/[plate]` (reescritas de corpo completo), auth/perfis, RLS efetiva (owner faz bypass); RLS atualmente bypassed (owner) — rever políticas na altura do auth
- Fotos de check-in guardadas como data URL na BD (TEXT) — migrar para object storage quando existir auth/Storage
- Entregas/faturas/garantias/stock/ferramentas/B2B: leitura ligada à BD, escritas ainda demo

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
- Topbar chrome não aparece em <lg (mobile tem header/drawer/bottom-nav próprios) — avaliar ações rápidas no drawer mobile
- Filtro `pathname.startsWith(item.href)` na nav pode dar falsos positivos futuros (ex.: `/tools` vs `/tooling`) — considerar `route matching` por segmentos
- Valores de cor/GU do seed de películas são aproximações de datasheets — afinar com leituras reais (L*a*b*/GU)

## Notas práticas
- Dev server: `npm run dev` em `localhost:3000` (não está a correr entre sessões).
- Git: commitar + push no fim de cada sessão (a pedido de Luís).

## Retomar
Dizer ao agente: "Lê `progresso.md` e continua pelos pendentes."
