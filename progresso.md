# Progresso — X-Flow

_Última atualização: 04/10/2026. Ficheiro de continuação de sessão — dizer ao agente: "Lê progresso.md e continua"._

## Estado do projeto
- X-Flow: CRM/OS para oficina PPF/wrap (Next.js 16.3.3, React 19.2.8, TS strict, Tailwind v4, base de dados Neon Postgres ligada)
- Health: typecheck OK, lint OK, 92/92 testes a passar
- **Git a funcionar**: repo em `main`, tudo commitado e pushed para `https://github.com/Zurcluis/x_flow.git` (remote `origin`, tracking ativo)
- `README.md` reescrito (03/10): setup, credenciais demo, scripts, arquitectura
- Fonte de verdade do produto: `X-Flow_AntiGravity_Master_Blueprint.md` + ADRs em `docs/adr/`
- Feed de progresso: `progresso.md` (este ficheiro)

## Sessão 04/10/2026 — E2E de auth no browser (35/35)
- **Browser MCP extension indisponível outra vez** (3 timeouts seguidos) — em vez de HTTP puro, o E2E corre num Chromium headless do playwright instalado em `CulturaBuilder/.../node_modules/playwright` (via `createRequire`; fallback channel `chrome`/`msedge` porque o build de browsers local era anterior ao do pacote)
- **`scripts/e2e-auth-browser.mjs`** (novo, idempotente): 35 checks — T1 /login com chips demo; T2 password errada → "Credenciais inválidas."; T3 rate limit (11 tentativas ghost@ → "Demasiadas tentativas." após 10); T4 login Patrícia → dashboard com "Centro de Comando" + nome no Topbar; T5 20 páginas internas 200 sob RLS da role `xflow_app` com dados amostrados da BD (customers/vehicles/quotes/production/stock/invoices/team), incluindo /calendar, /deliveries, /warranties, /team, /tools, /time-book, /b2b, /my-day, /reports, /settings, /design-system, /shop-floor, /simulator; T6 logout via dropdown do perfil (botão está dentro do menu — abrir pill primeiro) → /login; T7 `next=%2Fcustomers` respeitado; T8 `next=https://evil.example` bloqueado (safeNext → /); T9a cookie forjado → redirect /login; T9b /login com cookie forjado renderiza o form (sem loop); T10 5 rotas públicas por token 200 sem sessão (portal, quotes/public, checkins/report, warranties/certificate, qc/certificate) + token inválido → 404
- **Nota T10**: `/warranties/certificate/[token]` valida o token (404 para inválido) mas o corpo é `WarrantyCertificateView` com demo data (`initialWarrantiesData.find(...)` na view) — já estava no pendente "certificados QC/garantia públicos ainda têm fallback demo"
- Validação: 35/35 checks, typecheck OK, lint OK, 92/92 testes; commit + push feito

## Sessão 03/10/2026 — Autenticação + RLS efetiva (com agentes paralelos)
- **Migração 16** (`auth_sessions.sql`): `profiles.password_hash` + `last_login_at` (scrypt N=16384/r=8/p=1, formato `scrypt:N:r:p:<saltHex>:<hashHex>`, NFKC), tabela `auth_sessions` (token 32 bytes base64url, SHA-256 hex na BD, cookie `xflow_session` httpOnly/sameSite=lax/secure 30 dias), políticas `profiles_self`, `memberships_org`, `auth_sessions_any` (permissiva — o hash do token é a credencial)
- **Migração 17** (`rls_policies_all.sql`): RLS nas 40 tabelas + 38 políticas `org_isolation_*` completas (tabelas org diretas, filhas por FK, OR-clauses por token público: `quotes.public_token`, `checkins.token`, `deliveries.token`, `warranties.token`, `qc_inspections.certificate_number`), orgs por `bootstrap_org_slug`
- **Migração 18**: helper `current_organization_id()` null-safe (`NULLIF`) — `RESET` deixa `''` (não NULL) e o cast `''::uuid` quebrava políticas; verificado com script
- **Migração 19**: membros da org veem perfis da equipa (os `JOIN profiles` do dashboard/agenda ficavam a NULL com política "só o próprio")
- **Migração 20**: separação leitura/escrita — profiles (SELECT org/próprio/lookup; UPDATE só o próprio) e organization_memberships (SELECT org/próprio; escrita org-strict); política legada `org_isolation_memberships` removida
- **Role `xflow_app`** (`scripts/create-db-role.mjs`): role não-owner com RLS efetiva; grants ALL em tabelas/sequences + `ALTER DEFAULT PRIVILEGES`; `DATABASE_URL_APP` gravado em `.env.local` com ligação DIRETA (sem pooler — GUCs de sessão vazam via pgbouncer transaction-mode); `db.ts` falha arranque em produção sem `DATABASE_URL_APP`
- **`src/server/auth.ts`**: `loginAndCreateSession` (rate limit in-memory 10/15min IP+email, dummy-hash no miss contra timing enumeration, user_agent/ip registados, RESETs em try/finally), `getOptionalAuth`/`requireAuth` (redirect /login), `requirePublicToken` (5 kinds: quote/checkin/delivery/warranty/qc_certificate → notFound se inválido), `logoutCurrentSession`, `canSeeFinancials` (admin | workshop_manager)
- **`src/proxy.ts`**: fast-path por presença de cookie (matcher exclui estáticos/catálogos/modelos/mediapipe); sem redirect /login→/ (causava loop infinito com cookie revogado — a página de login já redireciona com sessão válida)
- **Wiring**: `requireAuth()` em 37 páginas internas (7 eram client components → reestruturadas em server page + view extraída); `requirePublicToken` nas 5 públicas; `loginAction`/`logoutAction` em `src/app/actions/auth.ts`; página `/login` com chips demo; Topbar com perfil real + "Terminar sessão"; layout passa `user` ao AppShell
- **Server actions protegidas (P0 do review)**: 28 ações em 9 ficheiros chamam `requireAuth()` e usam `auth.organizationId` (não o org hardcoded); as 2 ações públicas (`approvePublicQuoteAction`/`rejectPublicQuoteAction`) resolvem a org pelo token (`quote.organizationId`); open redirect no `next` do login validado
- **Bug real apanhado**: `getWarrantyByToken` passava o token como `warrantyId` (query `w.id = token` → sempre null → certificado de garantia público mostrava sempre dados demo); corrigido para filtrar por `w.token`
- **Review de segurança (builder-review)**: 37/37 páginas com guard confirmado; RLS testada com role temporária (isolamento por org, fluxo de login, token público não expõe customers); typecheck/lint/92 testes OK
- **Validação**: `node scripts/migrate.mjs` (16→20), `node scripts/verify-rls.mjs` (10 checks: ligação direta como xflow_app, RLS em 40 tabelas, 41 políticas, org fixada, token flow, sem GUC → 0 linhas), E2E por HTTP com sessão criada direto na BD: 19 páginas internas 200 (com dados renderizados: clientes/viaturas/orçamentos presentes no HTML), sem cookie → 307 `/login?next=%2F`, cookie forjado → 307 `/login`, rotas públicas por token 200 sem sessão
- **Pendentes desta sessão**: E2E no browser (login/logout/loop) — browser MCP indisponível durante a sessão; multi-tenant: GUC por REQUEST (hoje o pool fixa a org x-motion por conexão — com 1 org correto, com 2ª org a RLS fica decorativa; plano: checkout per-request com `set_config`); rate limit persistente (in-memory hoje); P2 do review: erros das ações devolvem `e.message` do Postgres, `auth_sessions_any` USING(true), `__Host-` prefix no cookie em prod, demo fallbacks em QC/garantia públicos
- **Credenciais demo**: password `xflow-demo-2026` para patricia=workshop_manager, joao/ricardo/miguel=technicians; Luís (luis@xmotion.pt, admin) definiu password pessoal em 03/10 via `scripts/set-password.mjs`

## Base de dados (Neon, 06/09/2026)
- **Neon Postgres 18.6** ligado e **15 migrações aplicadas** (35+ tabelas; 15: tabela `films` + `deliveries.belongings` JSONB)
- Connection string (pooler) em `.env.local` como `DATABASE_URL` — coberto por `.env*` no `.gitignore` (não commitar)
- **Seed global**: `node scripts/seed.mjs` (idempotente, truncate manual antes) — org, 5 perfis, 3 baias, catálogo, 6 materiais (3 críticos), 5 clientes, 6 viaturas, 5 orçamentos, 4 ordens com fases/tempos, check-ins, QC, agenda da semana, faturas, garantia+entrega
- **Seed de películas**: `node scripts/seed-films.mjs` (substitui o catálogo da org: DELETE+INSERT) — 245 películas (100 do 3M 1080 + 136 Avery SWF extraídas automaticamente das colour cards oficiais em `public/catalogos/` pelos parsers `scripts/parse-3m-catalog.mjs` e `scripts/parse-avery-catalog.mjs` → `scripts/catalog-data/*.json`, + 9 curadas XPEL/Stek/Inozetek/KPMF)
- **Migrações estruturais novas**: `node scripts/migrate.mjs` (idempotente por deteção de colunas/tabelas)

## Sessão 06/09 (noite) — Películas físicas no simulador + entregas reais (validado E2E)
- **Migração 15**: `films` (catálogo com parâmetros físicos: `gloss_gu`, `metallic`, `flake_scale`, `cost_per_meter_cents`, `warranty_years`, type clear_ppf_gloss/clear_ppf_matte/color_ppf/vinyl_wrap/chrome_delete) + `deliveries.belongings` JSONB
- **Simulação física em canvas** (`src/lib/film-simulation.ts`): composição por pixel sobre a foto real que preserva a luminância (sombras/reflexos/vãos), modelo difusão (cor do filme × shading) + especular derivada do GU + sparkle determinístico de flocos metálicos; PPF transparente preserva croma e aplica só o modelo de brilho; auto-exposição pela mediana; max 1200px, JPEG 0.92
- **Simulador** (`/simulator`): presets agora vêm da tabela `films` via `listFilms()` (fallback demo data se vazia); badge mostra "Efeito X · N GU"; resultado canvas no lado "Simulado" do slider com fallback CSS + indicador "a processar simulação física…" enquanto processa; FinishSelector mostra GU; carbon continua overlay CSS
- **Entregas reais** (`/deliveries/new`): página server com candidatos da BD (`listDeliveryCandidates` — OTs `completed` sem entrega, LEFT JOIN QC passed, pertences do último check-in da viatura); `NewDeliveryWizard` 3 passos (gate QC → checklist de pertences pré-preenchido → assinatura + notas); `createDeliveryAction`/`createDelivery` gravam em transação com token público; estado vazio com explicação
- **Bug apanhado no E2E**: SELECT não aliava `qc.certificate_number AS qc_certificate_number` — o gate de QC aparecia sempre "sem registo"; corrigido e revalidado (badge "QC 100% Aprovado" com QC-2026-44TX88-PASS)
- **Pass de raios para tokens** (~80 ficheiros): `rounded-[8px]→rounded-sm(10px)`, `[10px]→rounded-sm`, `[12px]→rounded-md`, `[14px]→rounded-md`, `[18px]→rounded-lg` fora dos tokens eliminados (pendente do audit de 05/09)
- Validação: typecheck, lint, 85/85 testes; E2E no browser — simulador gera JPEG simulado distinto do original (data URL) e re-simula ao trocar de película; entrega registada para WO-2026-098 (Ferrari UV-12-WX, pertences, assinatura demo, notas) persistida em `deliveries.belongings` JSONB e visível na ficha `/deliveries/[id]`

## Sessão 06/09 (noite, 2ª parte) — catálogos oficiais + simulação só na viatura + slider
- **Catálogos oficiais descarregados** em `docs/catalogos-peliculas/` (10 PDFs: 3M bulletin, Avery SW900 swatch+PDS, 4 TDS XPEL, 2 TDS Stek, catálogo KPMF 2023) + `README.md` com fontes, dados extraídos e correções vs. seed anterior (SKUs inventados corrigidos: Inozetek MSG025/SG004/DPPF901/DPPF809, KPMF K75320, 3M G12/M22/M227, Avery SW900-190/865/180/858; DYNOshield passou a 12 anos)
- **Seed de películas reescrito** (`scripts/seed-films.mjs`): 16 películas com códigos/garantias verificados nos catálogos; substitui o catálogo da org (DELETE+INSERT) porque os códigos mudaram
- **Simulação pinta só a viatura**: segmentação ML no browser com **MediaPipe Image Segmenter (DeepLab v3)** — modelo `deeplab_v3.tflite` (2,8 MB) + WASMs em `public/` (sem CDN em runtime; classe "car" do Pascal VOC + bus/motorbike); novo `src/lib/car-segmentation.ts` (singleton + feather 2× box blur); `film-simulation.ts` aplica a película com blending por alpha (ambiente fica pixel-idêntico salvo JPEG); fallback heurístico (flood-fill do fundo com suavização) se o modelo falhar
- **Slider antes/depois corrigido**: o input range só cobria uma faixa de 24px no fundo (a pega ↔ tinha pointer-events-none) — agora cobre toda a área da fotografia (`inset-0`, z-20, opacity-0) e arrasta em qualquer sítio; camadas com `pointer-events-none`
- **ESLint**: `public/**` ignorado (JS/WASM de terceiros do MediaPipe)
- Validação: typecheck, lint, 85/85 testes; E2E no browser — cantos do fundo com diff 0,0% e centro (viatura) ~73% alterado, com gloss black e PPF transparente; slider arrastado de 28→82 com clip-path a acompanhar; sem foto de check-in a silhueta vetorial mantém-se

## Sessão 06/09 (noite, 3ª parte) — Estúdio 3D em WebGL + catálogo Avery + painel por marcas
- **Estúdio 3D real no `/simulator`** (inspirado no Car Visualizer da Avery/Wrapstock, que é um iframe WebGL): novo `src/components/xflow/simulator/CarStudio3D.tsx` com three.js 0.185 + @react-three/fiber 9 + drei 10 (dinâmico com `ssr:false`); tabs "Estúdio 3D" (default) / "Foto real" (simulação canvas anterior, agora secundária)
- **5 modelos de viatura** (`src/lib/car-models.ts` registry + chips no palco): 458 Desportivo (three.js, MIT), Sedão e Buggy Technic (BabylonJS Assets, Apache-2.0), Furgão Comercial e Miniatura (Khronos glTF samples, CC-BY) em `public/models/` + `CREDITS.md`; escala/posição normalizadas por bounding box; pintura por mesh OU por material conforme o modelo
- **Material de pintura física mapeado do catálogo**: GU → rugosidade + clearcoat (gloss espelhado, matte veludo), metallic → metalness, chrome → espelho, carbono; PPF transparente preserva a cor de origem; luz de estúdio com Lightformers (sem HDR externo), ContactShadows, ACES; orbit + zoom, presets de câmara animados (3/4, Frente, Perfil, Traseira, Topo), rotação automática e screenshot PNG (`preserveDrawingBuffer`)
- **Catálogo Avery Dennison extraído**: novo `scripts/parse-avery-catalog.mjs` lê a colour card oficial 2026 (`public/catalogos/Avery.pdf`) — 136 cores com acabamento (Gloss/Matte/Satin/Metallic/Pearl/Diamond/ColorFlow/Rugged) e cor amostrada por grelha (pitch por coluna, percentil 25); dedupe de nomes repetidos com acabamento/código
- **Seed de películas: 245** (100 do 3M 1080 + 136 Avery SWF + 9 curadas XPEL/Stek/Inozetek/KPMF) — `node scripts/seed-films.mjs`
- **Painel de películas por marca, sem scroll**: grelha 2 colunas no desktop (palco sticky à esquerda, `lg:sticky`); tabs de marca com contagens (3M · Avery · XPEL · Stek · Inozetek · KPMF); clicar numa cor aplica de imediato no 3D; rodapé com preço/m, garantia e CTA orçamento; swatches com tooltip de specs
- **Modo "só chapa" implementado** na simulação de foto: `applyMode "panels"|"car"` em `film-simulation.ts` — `restrictToPanels()` exclui vidros (reflexo ≈ céu/fundo no topo), pneus/grelha/frisos (luminância < 30) e texturas (densidade de arestas > 26), com feather; chips "Só chapa metálica / Viatura toda" no modo foto
- Validação: typecheck, lint, 85/85 testes; E2E no browser — troca de modelo muda o render (pixéis verificados), tabs de marca e aplicação instantânea de cor confirmadas, aside sticky ativo em ≥1024px
- **Próximos passos sugeridos**: partial wrap (capô/techo em peças separadas), modelos de marcas reais (exigem licença comercial — Sketchfab/CGTrader — integrar em `car-models.ts`), share por URL, normal maps de flake/carbono

## Ainda por ligar (usa demo data)
- `/vision` (fase 8 do blueprint — análise IA), `/qc/certificate/[n]` e `/passport/[plate]` (reescritas de corpo completo); certificados QC/garantia públicos ainda têm fallback demo
- Multi-tenant: GUC `app.current_organization_id` é fixado por CONEXÃO (x-motion) — com 2.ª org, RLS fica decorativa; migrar para GUC por request
- Auth: rate limit persistente (tabela), mensagens de erro genéricas nas ações (hoje devolvem `e.message` do Postgres), prefixo `__Host-` no cookie em prod
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
- ~~E2E no browser (primeira tarefa da próxima sessão)~~ — FEITO em 04/10 (ver sessão 04/10); regressão futura: `node scripts/e2e-auth-browser.mjs` com dev server ligado
- Topbar chrome não aparece em <lg (mobile tem header/drawer/bottom-nav próprios) — avaliar ações rápidas no drawer mobile
- Filtro `pathname.startsWith(item.href)` na nav pode dar falsos positivos futuros (ex.: `/tools` vs `/tooling`) — considerar `route matching` por segmentos
- Valores de cor/GU do seed de películas são aproximações de datasheets — afinar com leituras reais (L*a*b*/GU)

## Notas práticas
- Dev server: `npm run dev` em `localhost:3000`. Reiniciar após alterações em `.env.local` (DATABASE_URL_APP). 
- Auth demo: password `xflow-demo-2026` para os técnicos/patrícia; Luís usa a password pessoal dele.
- `node scripts/verify-rls.mjs` valida a RLS por linha de comandos (10 checks).
- `node scripts/e2e-auth-browser.mjs` corre o E2E de auth no browser (35 checks; usa o playwright instalado em CulturaBuilder/.../node_modules, não faz parte do package.json).
- Git: commitar + push no fim de cada sessão (a pedido de Luís).

## Retomar
Dizer ao agente: "Lê `progresso.md` e continua pelos pendentes."
