# X-Flow: Plano Diretor — Website Público, Portfólio Dinâmico, Social Studio & Guião de Captação

> **Documento:** Plano de arquitetura e implementação  
> **Versão:** 1.2  
> **Data:** 25 de outubro de 2026  
> **Sistema suporte:** X-Flow by X-Motion — Next.js 16.4.2, Neon Postgres, Tailwind CSS 4  
> **Site de referência:** `https://x-motion-atelier.snug-lemon-5392.chatgpt.site`  
> **Destinatário:** Luís Cruz, X-Motion  
> **Relação com o Plano Site:** este documento descreve a **opção B1** — integrar o site público no X-Flow com dois hosts. O `Plano_Site_X-Motion.md` v1.1 recomendava manter a **opção A** (site autónomo) até aos gatilhos definidos; o Luís aprovou B1 em 25 de outubro de 2026. A opção A fica apenas como fallback registado.

> **Alterações da versão 1.2:** decisão registada — B1 em duas apps com hosts separados e token unificado de passaporte; Fase 0 auditada, com bloqueios identificados; plano de transição dos tokens existentes; critérios, riscos e roadmap ajustados à decisão. As alterações técnicas da versão 1.1 mantêm-se. Nenhuma funcionalidade foi implementada por esta revisão.

---

## 1. Visão Estratégica e Decisão de Arquitetura

No setor de personalização automóvel (PPF, Car Wrap, Color PPF e Detalhe), **a autoridade visual é o principal motor de vendas**. Os clientes compram a transformação, a precisão do trabalho e a confiança no artesão.

Uma oficina individual tem pouco tempo para criar conteúdo e atualizar plataformas. Depois de um dia de trabalho manual intenso, não sobram horas para abrir um CMS, redimensionar fotos, escrever legendas ou atualizar o portfólio. O X-Flow já recolhe registos em momentos obrigatórios do trabalho; o objetivo é aproveitá-los sem criar uma segunda operação.

### 1.1 O ciclo virtuoso

O X-Flow já tem os momentos certos para recolher prova:

1. **Check-in:** cinco fotografias obrigatórias — frente, lateral esquerda, lateral direita, traseira e tejadilho — mais odómetro e detalhe de danos quando aplicável.
2. **Produção:** fotografias de evolução e pormenor, em oito fases técnicas.
3. **Entrega e QC:** fotografias finais, assinatura e condições de garantia — **ainda não persistidas na aplicação**, o que é um pré-requisito para publicação automática.

O ciclo pretendido é:

```text
[ 1. ATRAÇÃO ]
Site público, portfólio e Instagram
        |
        v
[ 2. INTERAÇÃO ]
Estúdio de cor demonstrativo e pedido de proposta
        |
        v
[ 3. OPERAÇÃO ]
Lead qualificada, orçamento, agenda e baia
        |
        v
[ 4. PRODUÇÃO ]
Oito fases com fotografia e checklist
        |
        v
[ 5. ENTREGA E QC ]
Fotos finais, garantia, passaporte e publicação aprovada
        |
        v
( volta ao ponto 1 )
```

### 1.2 Estado, decisão e âmbito

O projeto tinha duas abordagens possíveis. A decisão foi registada em 25 de outubro de 2026: **B1**, com dois hosts, e **token unificado** de passaporte. A opção A deixa de ser a recomendação ativa e fica apenas como fallback.

| Decisão | Estado | Efeito neste plano |
| --- | --- | --- |
| **A. Site autónomo + integração de leads** | Fallback registado | Só se B1 se revelar inviável; exige decisão nova |
| **B1. Site no X-Flow com dois hosts** | **Aprovada** em 25/10/2026 | Site público em `www`; X-Flow em `app`; root layouts, cookies e SEO separados |
| **B2. Dashboard movido para `/dashboard`** | Rejeitada para o MVP | Evita refactor de todas as rotas e links do ERP |
| **Sistema de registo** | D1 é buffer; Neon/X-Flow é fonte de verdade após sincronização | Nenhum pedido é considerado tratado antes de chegar ao X-Flow |
| **Passaporte público** | **Token unificado** em `passport_access_tokens` | Hash, expiração, revogação e DTO mínimo; migrar os tokens antigos |
| **Portfólio** | Publicação curada, com consentimento | Sem autorização não há publicação |
| **3D público** | Adiado | Manter 3D interno; público só com modelo licenciado e otimizado |
| **Social Studio** | Faseado: copy e partilha manual antes de automação | Meta/TikTok só depois de aprovação e revisão |

**Decisão registada:** B1 e token unificado. B2 fica rejeitada para o MVP. Os gatilhos do Plano Site deixam de ser condição de arranque e passam a servir apenas para rever prioridades. A decisão não autoriza saltar a Fase 0, a migração 30 ou os testes de isolamento.

### 1.3 O que este plano não faz

- Não reabre a decisão B1 sem novo registo; a opção A é apenas fallback.
- Não promete publicação automática antes de existirem fotos de entrega, QC e garantia persistidos.
- Não torna o simulador interno público.
- Não usa matrícula como identificador público.
- Não publica imagens sem autorização.
- Não promete automação Meta/TikTok, geração de imagens ou 3D público no MVP.
- Não substitui revisão jurídica da política de privacidade, consentimentos e termos.

### 1.4 Princípios

1. **Trabalho real, não simulação disfarçada.** Simulações e imagens demonstrativas são identificadas como tal.
2. **Consentimento antes de publicação.** A autorização do proprietário é um requisito, não uma formalidade.
3. **Privacidade por omissão.** O público vê o mínimo necessário; o resto fica no X-Flow.
4. **Uma fonte de verdade.** Evitar duplicar clientes, viaturas, películas e conteúdo.
5. **Sem promessas não confirmadas.** Material, cor, garantia, durabilidade e prazos exigem fonte.
6. **Desempenho e acessibilidade desde o início.** O site público é mobile-first e WCAG 2.2 AA.
7. **Fases pequenas e reversíveis.** Nada de automação antes de a operação manual funcionar.

---

## 2. Módulo 1: Website Público

### 2.1 Estratégia de rotas e isolamento

O repositório atual **não tem** os grupos `(public)` e `(dashboard)` descritos na versão anterior. Tem:

- `src/app/page.tsx` como dashboard autenticado em `/`.
- `src/app/layout.tsx` com `getOptionalAuth()` e `AppShell` a envolver todas as rotas.
- `src/proxy.ts` com uma allowlist de prefixos públicos.
- `/simulator` interno, protegido por role.
- `/passport/[plate]` interno, protegido por sessão.

O repositório já tem rotas públicas por token — `/portal/[token]`, `/quotes/public/[token]`, `/checkins/report/[token]`, `/qc/certificate/[certificateNumber]` e `/warranties/certificate/[token]` — e o `AppShell` já as renderiza sem shell. `deliveries.token`, `warranties.token`, `checkins.token` e `quotes.public_token` já existem e são usados por essas rotas. O passaporte público usa o token unificado; os antigos são mantidos apenas durante a transição.

Isto significa que uma homepage pública em `/` colide com o dashboard e herda o layout da aplicação. As opções são:

| Opção | Vantagens | Custos e riscos | Recomendação |
| --- | --- | --- | --- |
| **A. Manter o site autónomo e integrar só leads** | Não mexe no ERP; lançamento rápido; separa marketing de operação | Duas plataformas; sincronização de leads e portfólio | Fallback |
| **B1. Duas aplicações no mesmo repositório, com hosts separados** | ERP atual intacto; `site/` público isolado; deploys, cookies e SEO separados | Duas apps e dois projetos Vercel; alguma configuração duplicada | **Aprovada** |
| **B1b. Uma aplicação com route groups e rewrite por host** | Um só deploy e código partilhado | Obriga a mover o dashboard ou reescrever `/`; maior risco de regressão | Rejeitada no MVP |
| **B2. Mesmo repositório, dashboard movido para `/dashboard`** | Mantém um só host | Refactor grande de todas as rotas e links; maior risco de regressão | Rejeitada |

**Decisão e implementação:** executar B1 com duas aplicações no mesmo repositório — o ERP atual em `app.<domínio>` e um novo site público em `site/` para `www.<domínio>`, com projetos Vercel separados. Isto evita mover o dashboard e mantém o `src/app/layout.tsx` atual. O site público não deve partilhar cookies de sessão com o ERP. A opção A só volta a ser considerada se B1 falhar por custódia, capacidade ou custo, com decisão registada.

### 2.2 Layout público e fronteira com o X-Flow

O layout público **não pode** herdar `AppShell`, `getOptionalAuth()` nem a metadata do X-Flow.

Com B1 aprovada, a implementação recomendada é:

- `site/`: novo projeto Next.js público, com `package.json`, `next.config`, root layout, proxy e deploy próprios.
- O ERP mantém `src/app/layout.tsx`, `AppShell`, `getOptionalAuth` e o dashboard em `/`.
- `site/` não importa módulos de servidor, auth, cookies ou `AppShell` do ERP.
- Partilhar apenas tokens de design, tipos e validação pura; se necessário, extrair um pacote pequeno.
- O formulário do site chama `POST /api/proposals` no ERP por HTTPS, com origem/segredo, rate limit e idempotência.
- Metadata, canonical, Open Graph e `lang="pt-PT"` no layout do site.
- O passaporte público vive em `site/passaporte/[token]`; `/passport/[plate]` continua interno no ERP.
- Testar que nenhum cookie do ERP é enviado ou aceite no domínio público.

A alternativa B1b — uma só aplicação com route groups e rewrite por host — fica rejeitada no MVP por risco de regressão.

Se B1 for revertida para A, esta secção aplica-se ao projeto autónomo e a integração faz-se apenas por API.

### 2.3 Proxy e allowlist

O `src/proxy.ts` atual pertence ao ERP e usa `pathname.startsWith(prefix)`. Com duas aplicações, não é necessário colocar `/` na allowlist do ERP; o site tem o seu próprio proxy.

**ERP (`app.`)**

- Manter a allowlist atual e as rotas públicas por token: `/portal/`, `/quotes/public/`, `/checkins/report/`, `/qc/certificate/` e `/warranties/certificate/`.
- `/` continua dashboard; `/passport/[plate]` continua privado.
- `POST /api/proposals` é o único endpoint novo chamado pelo site; validar `Origin`, segredo, rate limit durável e idempotência.
- Não aceitar cookies do site nem confiar em dados do browser.

**Site (`www.`)**

- Proxy/middleware próprio; `/` é a homepage pública.
- Rotas públicas: `/`, `/portfolio`, `/portfolio/[slug]`, `/estudio`, `/passaporte/[token]`, `/contactos`, `/privacidade`.
- Assets e matcher próprios em `site/`.
- Pré-visualização com `noindex` e regra de acesso própria.
- Sem cookies de sessão do ERP.

**Testes:** matriz público/privado em cada app; chamada site→ERP; `Origin`; rate limit; idempotência; ausência de cookies cruzados.

### 2.4 Rotas públicas propostas

| Rota | Função | Dados públicos |
| --- | --- | --- |
| `/` | Homepage editorial | Serviços, destaques, contactos confirmados |
| `/portfolio` | Galeria filtrável | Projetos publicados e aprovados |
| `/portfolio/[slug]` | Caso de estudo | Fotos, descrição, material confirmado, antes/depois |
| `/estudio` | Estúdio de cor demonstrativo | Carro demonstrativo, catálogo público sem custos |
| `/passaporte/[token]` | Passaporte do cliente | Viatura, serviços, garantia e cuidados; sem PII interna |
| `/contactos` | Contactos e localização | NAP confirmado, horário e mapa |
| `/privacidade` | Privacidade e cookies | Texto revisto |
| `POST /api/proposals` | API do ERP chamada pelo site | Cria apenas `website_leads` |

### 2.5 Ciclo do lead

O fluxo anterior criava cliente, viatura e orçamento automaticamente. Isso não é seguro nem compatível com o schema atual:

- `customers.phone` é `NOT NULL`; o formulário tem telefone opcional.
- `vehicles` exige matrícula, carroçaria, cor e ano; o formulário só recolhe marca, modelo e ano.
- `quotes.status` não aceita `lead_website`; aceita `draft`, `sent`, `viewed`, `approved`, `rejected` e `expired`.
- `quotes` exige `quote_number`, `public_token` e `expires_at`.
- Criar registos incompletos ou duplicados polui o CRM e a faturação.

**Fluxo correto no MVP:**

1. O visitante submete o formulário com serviço, viatura, nome, e-mail, telefone opcional, mensagem e consentimento.
2. O endpoint valida no servidor, aplica honeypot e limitação de pedidos e grava **apenas** `website_leads`.
3. O lead recebe um identificador idempotente; reenvios não duplicam o registo.
4. O responsável vê o lead numa caixa própria do X-Flow e responde no prazo definido.
5. Se o lead for qualificado, o responsável cria ou associa cliente, viatura e orçamento com os dados completos.
6. A conversão fica registada no lead (`converted_customer_id`, `converted_vehicle_id`, `converted_quote_id`).

O cartão imediato em `/my-day` não existe para leads; `/my-day` mostra ordens de trabalho e marcações. É necessário criar uma caixa de leads e uma notificação interna.

### 2.6 Simulador público

O `/simulator` atual é uma ferramenta interna. Carrega viaturas reais, mostra matrícula e proprietário, calcula custo, preço e margem e usa fotos de check-in. **Não pode ser publicado como está.**

Para o público:

- Usar um carro demonstrativo, não viaturas de clientes.
- Excluir `plateDisplay`, proprietário, custo por metro, preço, margem e dados internos.
- Usar um DTO público com cor, acabamento, brilho e nome comercial confirmado.
- Identificar a simulação como aproximada e confirmar a cor em amostra física.
- Não carregar o catálogo de custos nem o histórico de clientes no payload do cliente.
- 3D público só com modelo licenciado para uso comercial, otimizado e com fallback estático.

### 2.7 SEO, medição e consentimento

O site público precisa de metadata própria, independente do X-Flow.

- Título e descrição únicos por página.
- `metadataBase`, canonical e Open Graph/Twitter Card.
- Dados estruturados `AutoRepair`/`LocalBusiness`, `Organization`, `WebSite`, `Service` e `BreadcrumbList`.
- `sitemap.xml` e `robots.txt`; `noindex` apenas em pré-visualização.
- Google Business Profile com o mesmo nome, morada, telefone e horário.
- Página 404 e redirecionamentos 301.
- Analítica sem cookies por omissão; eventos de contacto separados do envio do formulário.
- Consentimento de marketing separado do pedido de contacto.
- Nenhum dado pessoal enviado para analítica, logs ou URLs.

### 2.8 Segurança do formulário público

- Validação server-side de todos os campos.
- Limitação de pedidos **durável**, não apenas em memória.
- Honeypot; Turnstile ou equivalente se houver abuso.
- Verificação de `Origin` e rejeição de pedidos fora do domínio.
- Normalização e limite de tamanho de todos os campos.
- Sem dados pessoais em logs de erro.
- RLS e endpoint server-only; nunca expor a role de aplicação ao browser.
- Teste de duplicação, reenvio, spam e falha parcial.

---

## 3. Módulo 2: Portfólio Dinâmico & Curadoria

### 3.1 Publicação curada primeiro

O MVP não deve publicar automaticamente a partir da entrega. Ainda não existem:

- Fotografias finais persistidas na entrega.
- Persistência de QC e emissão de garantia.
- Consentimento de imagem por viatura.

Até esses pré-requisitos existirem, o portfólio é **curado manualmente** no X-Flow, com fotos originais fornecidas pelo Luís. A automação entra depois de a operação e o consentimento estarem estáveis.

### 3.2 Consentimento e direitos de imagem

A anonimização da matrícula não substitui a autorização do proprietário.

Cada projeto deve registar:

- Proprietário e contacto.
- Âmbito autorizado: site, Instagram, Facebook, TikTok, anúncios.
- Data e validade da autorização.
- Documento ou prova de consentimento.
- Revogação e data de remoção.
- Tratamento de pessoas, interiores, objetos e matrícula.

Regras:

- Sem autorização, não há publicação.
- A matrícula é tapada no ficheiro publicado, não apenas por uma camada por cima.
- Pessoas e interiores são removidos ou desfocados quando não autorizados.
- EXIF e GPS são removidos dos derivados públicos.
- O original privado fica no X-Flow; o público só recebe o derivado aprovado.
- A revogação retira o projeto do site e das redes, mantendo o registo interno.

### 3.3 Antes e depois

O antes/depois só é honesto quando existe uma foto real de entrada e uma foto real de saída.

- Usar a foto de check-in como “antes” apenas se estiver autorizada e sem danos sensíveis.
- Usar a foto final de entrega/QC como “depois”; **essa captura ainda não existe**.
- Até existir, usar upload manual de pares reais, nunca montagens enganosas.
- Identificar claramente simulações.
- Não usar a mesma foto em dois estados.
- Não revelar matrícula, pessoas, interiores ou bens.

### 3.4 Armazenamento e derivados

As fotos de check-in atuais são data URLs JPEG de 1600 px, com limite de 2 MB por foto e 5,5 MB por conjunto, guardadas em Postgres. Isso não serve para um site público.

Arquitetura necessária:

- Object storage (Vercel Blob, S3 ou R2) para originais privados e derivados públicos.
- Base de dados guarda chaves, não blobs.
- Derivados WebP/AVIF, com larguras para grelha, detalhe e partilha.
- Remoção de EXIF/GPS e metadados desnecessários.
- Miniaturas e crops por dispositivo.
- URLs públicas apenas para derivados aprovados; originais com acesso privado.
- Limpeza de ficheiros órfãos e política de retenção.

### 3.5 Fluxo de publicação

1. Rascunho.
2. Revisão de conteúdo e dados técnicos.
3. Consentimento validado.
4. Imagens tratadas e aprovadas.
5. Publicação.
6. Atualização ou arquivo.
7. Revogação, quando pedida.

Cada transição deve ter responsável, data e registo de auditoria.

### 3.6 Regras de qualidade

- Não publicar afirmações de material, cor, garantia ou durabilidade sem fonte confirmada.
- Não publicar matrícula, proprietário, VIN, quilometragem ou faturas.
- Não publicar fotos de clientes sem autorização.
- Não apresentar simulações como trabalhos reais.
- Não usar imagens de marcas ou películas de forma que sugira parceria não confirmada.
- Texto alternativo descritivo em todas as imagens.
- Dimensões e formatos definidos para evitar saltos de composição.

---

## 4. Módulo 3: X-Flow Social Studio

### 4.1 Âmbito faseado

O Social Studio é útil, mas não é pré-requisito para lançar o site. A ordem defensável é:

1. **Fase A:** gerar copy a partir de dados confirmados e permitir copiar/partilhar manualmente.
2. **Fase B:** gerar modelos visuais 4:5 e 9:16 com assets aprovados.
3. **Fase C:** agendamento e publicação via Meta Graph API/TikTok, após aprovação das apps e revisão de segurança.

O MVP não inclui automação de publicação.

### 4.2 Gemini com guardrails

O Gemini já está integrado para texto e TTS. Para copy de marketing:

- Injetar apenas factos confirmados: viatura, serviço, película (`film_id`, `sku`, `color_hex`), fases concluídas e notas aprovadas.
- Proibir a IA de inventar garantia, durabilidade, preço, certificação, parceria ou resultado.
- Separar “processo interno” de “promessa pública”.
- Exigir aprovação humana antes de publicar.
- Registar prompt, resposta e revisor, sem dados pessoais desnecessários.
- Não usar notas internas de clientes como matéria-prima pública.
- Validar nomes de películas e marcas antes de publicar.

### 4.3 Geração de imagens

A geração de carrosséis e stories exige pré-requisitos que ainda não existem:

- Storage e derivados.
- Biblioteca de fontes com licença comercial.
- Composição server-side (`sharp` ou equivalente) ou browser-side.
- Templates aprovados e versionados.
- Ficha técnica com dados confirmados, não inventados.
- Testes de legibilidade em ecrã pequeno.

Sem estes pré-requisitos, a geração de imagens fica fora do MVP.

### 4.4 Meta/TikTok

A publicação automática exige:

- Conta profissional e app aprovada pela Meta.
- Permissões, revisão e verificação de negócio.
- Armazenamento de tokens com rotação e revogação.
- `external_post_id`, estado, erro, tentativas e retry.
- Política de falha e notificação.
- Conformidade com as regras de cada plataforma.

Até isso existir, o fluxo é manual: descarregar assets, copiar legenda e publicar na app.

### 4.5 Kit social do cliente

O kit é uma boa ideia, mas depende de:

- Passaporte por token, não por matrícula.
- Autorização de imagem.
- Fotos sem matrícula, pessoas ou interiores.
- Web Share API, ficheiro ZIP ou downloads individuais; o navegador móvel não garante descarregar um álbum para a galeria.
- Envio manual por WhatsApp (`wa.me`) ou integração futura com API; hoje não há API de WhatsApp configurada.

### 4.6 Medição

Não apresentar “taxa de retenção superior a 85%” sem fonte. Medir:

- Cliques no kit.
- Downloads ou partilhas efetivas.
- Submissões de proposta com origem no kit.
- Publicações feitas e resultados.

As fórmulas de conteúdo são hipóteses a testar, não garantias.

---

## 5. Módulo 4: Guião de Captação

### 5.1 Realidade atual

- O check-in exige **cinco** fotografias: frente, lateral esquerda, lateral direita, traseira e tejadilho.
- As imagens são comprimidas para 1600 px e JPEG 0,72 antes de serem guardadas.
- O limite é 2 MB por foto e 5,5 MB por conjunto.
- Não são “alta resolução” para impressão; são suficientes para ecrã e redes, com limitações.
- Não existe captura de vídeo nem armazenamento de clipes na obra.

### 5.2 Matriz de captação nas oito fases reais

As fases reais são: `prep_decontamination`, `disassembly`, `film_cutting`, `application`, `assembly`, `thermal_cure`, `detailing_finish` e `quality_control`. A entrega é um momento separado, não uma nona fase.

| Fase real | O que filmar (3 a 5 s) | Ângulo e enquadramento | Dica de áudio |
| --- | --- | --- | --- |
| Preparação e descontaminação | Canhão de espuma e reação férrica na jante | Plano médio low-angle, câmara junto ao solo | Espuma e água sob pressão, sem música |
| Desmontagem | Fio de corte a descolar emblema; puxador a sair | Macro close-up a 10 cm, foco no detalhe | Estalo da fita e da ferramenta |
| Corte e plotter | Rolo a desenrolar; lâmina a cortar | Top-down a 45° sobre a mesa | Movimento mecânico da cabeça |
| Aplicação | Espátula a expulsar água; película a ficar transparente | Lateral rasante a 30°, reflexo da luz | Espátula em feltro sobre a água |
| Cura térmica | Pistola de calor; ruga a relaxar | Close-up com contraluz para ver o vapor | Fluxo térmico |
| Montagem | Periféricos a voltar ao lugar; remates | Plano médio, mãos e encaixe | Clique de encaixe |
| Acabamento e detalhe | Limpeza de vidros, aspiração, selante | Plano médio e macro | Silêncio e sons de limpeza |
| Controlo de qualidade | Lâmpada a percorrer a chapa | Tracking horizontal constante | Reflexo limpo, sem ruído |
| Entrega (fora das oito fases) | Portão a abrir; carro sob luz natural | Plano aberto lento, do detalhe ao conjunto | Transição para o som exterior |

### 5.3 Fórmulas de conteúdo

As fórmulas continuam válidas como **hipóteses**, mas sem prometer resultados.

**A. ASMR do detalhe (15–18 s).** Sons reais, sem música alta: espuma, descolagem, espátula, calor, luz de inspeção.

**B. Transição relâmpago (5–7 s em loop).** Carro original, dois toques no capô, corte para o carro transformado. Texto curto e honesto; sem prometer que o algoritmo repete o vídeo.

**C. A diferença do processo (25–35 s).** Explicar preparação, desmontagem e remates. Não comparar com preços de concorrentes nem usar “800 €” como isca. Se se mencionar “zero cortes” ou “8 mm”, confirmar que é verdade para aquele material e escrever como processo, não como garantia absoluta.

### 5.4 Interface móvel

- Cartão discreto na ordem de trabalho com a dica da fase.
- Ângulo, ação e duração.
- Cronómetro curto.
- Sem bloquear a execução técnica.
- Aviso para não filmar pessoas, matrículas ou interiores sem autorização.

### 5.5 Vídeo

A captura de clipes exige storage, organização por obra, limites de tamanho, consentimento e, mais tarde, edição. Fica para depois do MVP de portfólio e leads.

---

## 6. Módulo 5: Modelo de Dados, RLS e Armazenamento

### 6.1 Tabelas novas

O SQL abaixo é uma proposta. Não deve ser aplicado sem revisão, migração numerada e testes.

```sql
-- 1. Configuração pública por organização
CREATE TABLE IF NOT EXISTS public.site_settings (
  organization_id UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  public_slug TEXT UNIQUE NOT NULL,
  public_domain TEXT UNIQUE,
  atelier_name TEXT NOT NULL,
  hero_headline TEXT NOT NULL,
  hero_subheadline TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Portugal',
  instagram_url TEXT,
  whatsapp_number TEXT,
  contact_email TEXT,
  address TEXT,
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  opening_hours JSONB,
  seo_title TEXT,
  seo_description TEXT,
  og_image_key TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Não usar contactos fictícios como `+351910000000` ou `geral@xmotion.pt`. Os valores são obrigatórios apenas quando confirmados; até lá, o site não publica o bloco de contacto.

```sql
-- 2. Projetos do portfólio
CREATE TABLE IF NOT EXISTS public.portfolio_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  work_order_id UUID REFERENCES public.work_orders(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  film_id UUID REFERENCES public.films(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  service_category TEXT NOT NULL CHECK (service_category IN ('ppf', 'car_wrap', 'color_ppf', 'details', 'motorcycle')),
  description TEXT,
  film_brand_snapshot TEXT,
  film_name_snapshot TEXT,
  film_finish_snapshot TEXT,
  film_sku_snapshot TEXT,
  seo_title TEXT,
  seo_description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived')),
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_portfolio_slug_org UNIQUE (organization_id, slug)
);
```

Usar `film_id` e snapshots. Não duplicar `color_code`, que não existe em `films`; usar `sku` e `color_hex`. Não usar `hero_featured`; o campo é `is_featured`.

```sql
-- 3. Imagens do portfólio
CREATE TABLE IF NOT EXISTS public.portfolio_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  portfolio_project_id UUID NOT NULL REFERENCES public.portfolio_projects(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('before', 'after', 'detail', 'process')),
  storage_key TEXT NOT NULL,
  alt_text TEXT,
  width INTEGER,
  height INTEGER,
  format TEXT,
  byte_size INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_cover BOOLEAN NOT NULL DEFAULT FALSE,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  redaction JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

`storage_key` substitui `media_url`. Nada de data URLs no site público.

```sql
-- 4. Consentimento de imagem
CREATE TABLE IF NOT EXISTS public.portfolio_consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  portfolio_project_id UUID NOT NULL REFERENCES public.portfolio_projects(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  owner_name TEXT NOT NULL,
  scope TEXT NOT NULL,
  evidence_key TEXT,
  signed_at DATE NOT NULL,
  expires_at DATE,
  revoked_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Sem consentimento ativo, o projeto não pode passar a `published`.

```sql
-- 5. Leads do site
CREATE TABLE IF NOT EXISTS public.website_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  idempotency_key TEXT NOT NULL,
  service_requested TEXT NOT NULL CHECK (service_requested IN ('advice', 'ppf', 'car_wrap', 'color_ppf', 'details', 'motorcycle')),
  vehicle_info TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'quoted', 'won', 'lost', 'spam', 'duplicate')),
  source TEXT,
  utm JSONB,
  privacy_notice_version TEXT NOT NULL,
  consent_at TIMESTAMPTZ NOT NULL,
  consent_text_hash TEXT,
  marketing_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
  first_response_at TIMESTAMPTZ,
  quote_value_cents INTEGER,
  lost_reason TEXT,
  notes TEXT,
  converted_customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  converted_vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  converted_quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_website_leads_idempotency UNIQUE (organization_id, idempotency_key)
);
```

O lead não cria automaticamente cliente, viatura ou orçamento.

```sql
-- 6. Passaporte público por token
CREATE TABLE IF NOT EXISTS public.passport_access_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  delivery_id UUID REFERENCES public.deliveries(id) ON DELETE SET NULL,
  token_hash TEXT NOT NULL UNIQUE,
  scope TEXT NOT NULL DEFAULT 'passport_read',
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Guardar apenas o hash. O link contém o token; a rota valida o hash e devolve um DTO mínimo. Nunca usar matrícula como identificador público.

**Decisão e compatibilidade:** o token unificado é a via aprovada. `deliveries.token` alimenta a entrega e a política RLS `app.public_token`; `warranties.token` alimenta `/warranties/certificate/[token]`; `checkins.token` alimenta `/checkins/report/[token]`; `quotes.public_token` alimenta `/portal/[token]`. Esses tokens mantêm-se nas rotas atuais durante a transição, mas o passaporte novo usa `passport_access_tokens`. A Fase 1 deve definir o mapa de migração, os redirects e o sunset dos tokens substituídos; não pode ficar um segundo mecanismo permanente.

```sql
-- 7. Publicações sociais (fase posterior)
CREATE TABLE IF NOT EXISTS public.social_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  portfolio_project_id UUID REFERENCES public.portfolio_projects(id) ON DELETE SET NULL,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'tiktok')),
  post_type TEXT NOT NULL CHECK (post_type IN ('carousel', 'reel', 'story')),
  caption TEXT NOT NULL,
  hashtags TEXT,
  media_keys JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'scheduled', 'published', 'failed')),
  approved_by UUID REFERENCES public.profiles(id),
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  external_post_id TEXT,
  error TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Não criar esta tabela no MVP se o Social Studio ainda não avançar.

### 6.2 RLS, migrações e grants

O repositório usa uma role partilhada com GUC de organização; não usa JWT Supabase. A migração 17 ativa RLS apenas nas tabelas existentes nessa altura; o runner termina na migração 29.

Regras:

- Criar a migração `20260828000030_public_site.sql` e registá-la no `scripts/migrate.mjs`.
- Ativar RLS em todas as tabelas novas.
- Leitura pública apenas de conteúdo publicado e aprovado.
- `website_leads`: INSERT apenas por endpoint server-side ou função `SECURITY DEFINER`; nunca SELECT público.
- `passport_access_tokens`: sem acesso público direto; validação server-side.
- Gestão restrita a `admin` e `workshop_manager`.
- Sem dados de consentimento em respostas públicas.
- Grants mínimos para a role da aplicação.
- Testes com GUC vazio, organização estrangeira e token inválido.
- Confirmar que `npm run db:verify` cobre as tabelas novas.

Políticas mínimas:

```sql
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passport_access_tokens ENABLE ROW LEVEL SECURITY;
-- social_posts: ativar apenas se a tabela for criada numa fase posterior.
-- ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
```

As políticas concretas devem seguir o padrão existente: organização ativa via GUC para gestão; leitura pública de `site_settings` apenas com `is_active = true`; leitura pública de portfólio limitada a `status = 'published'` e `is_approved = true`; inserção de leads por função controlada; nenhuma leitura pública de leads, consentimentos ou tokens.

### 6.3 Armazenamento

- Object storage para originais e derivados.
- Chaves por organização, projeto e tipo.
- Derivados WebP/AVIF e crops.
- EXIF/GPS removidos.
- Originais privados; derivados públicos.
- URL assinada ou CDN para público.
- Limpeza de órfãos e retenção definida.
- Backups e teste de restauro.

### 6.4 Integridade e idempotência

- `idempotency_key` no lead.
- Transações para conversão de lead em cliente/viatura/orçamento.
- Prevenção de duplicados por e-mail/telefone com regra explícita, não automática cega.
- Estados e transições auditáveis.
- Nenhum registo parcial em caso de falha.
- Reenvio manual a partir da caixa de leads.

### 6.5 O que não criar agora

- Estado `lead_website` em `quotes`.
- Criação automática de cliente/viatura/orçamento.
- `films.color_code` — usar `sku` e `color_hex`.
- `hero_featured` — usar `is_featured`.
- `media_url` com data URL.
- Tabelas sem RLS.
- Passaporte público por matrícula.
- Manter indefinidamente `deliveries.token`/`warranties.token` em paralelo com o token unificado; definir migração, redirects e sunset.
- Publicação automática sem consentimento.

---

## 7. Roadmap por Fases

As fases não têm datas fechadas. A estimativa depende da capacidade do Luís, da qualidade das fotos e da revisão jurídica.

### Fase 0 — Decisão e preparação

- Registar B1 e token unificado — **concluído em 25/10/2026**.
- Confirmar custódia de domínio, repositório, alojamento, DNS e backups.
- Escolher armazenamento de imagens.
- Definir política de consentimento e texto de privacidade.
- Confirmar contactos, morada, horário e dados legais.
- Registar afirmações comerciais e fontes.
- Confirmar a arquitetura de rotas/hosts de B1 (`www` e `app`).

**Saída:** decisão B1/token unificado registada e restantes pré-requisitos fechados.

**Estado da Fase 0 (25/10/2026):**

| Item | Estado | Evidência / próximo passo |
| --- | --- | --- |
| Repositório | Confirmado | GitHub `Zurcluis/x_flow`, branch `main` |
| Alojamento do ERP | Confirmado | Projeto Vercel `x-flow`, ligado em `.vercel/project.json` |
| Base de dados | Confirmado | Neon `ep-bold-waterfall-za7l5eoz` (eu-west-2), base `neondb`, pooler + ligação direta |
| CI | Confirmado | `.github/workflows/ci.yml` corre typecheck, lint, testes e build |
| Storage | **Recomendado** | Vercel Blob para o MVP; confirmar originais privados/URLs assinadas e limites. R2/S3 como alternativa |
| Arquitetura B1 | **Recomendado** | Duas apps no mesmo repo: ERP atual + `site/`, com projetos Vercel separados |
| Código do site público | **Bloqueado** | O código do site não está neste repositório nem no workspace; precisa de export/clone ou autorização para reconstruir |
| Domínio e DNS | **Pendente** | `NEXT_PUBLIC_APP_URL` ausente localmente; confirmar `www.<domínio>` e `app.<domínio>` |
| Backups | **Pendente** | Confirmar PITR/backups Neon e executar teste de restauro |
| Contactos e dados legais | **Pendente** | Telefone, WhatsApp, e-mail, morada, horário, firma e NIF |
| Consentimento e privacidade | **Pendente** | Texto, versão do aviso e revisão jurídica |
| Afirmações comerciais | **Pendente** | Fontes para 90 °C, 8 mm, garantias, materiais e parcerias |

**Bloqueios para fechar a Fase 0:** código-fonte do site, domínio/hosts, contactos e dados legais, storage, backups e fontes das afirmações comerciais.

### Fase 1 — MVP de leads, portfólio e passaporte

Com B1 aprovada:

- Criar `site/` com root layout, proxy e projeto Vercel próprios; manter o ERP intacto.
- Caixa de leads no X-Flow, com estados, primeira resposta e SLA.
- Migração 30, RLS e testes.
- Portfólio curado manualmente, com consentimento e storage.
- Passaporte público com token unificado, expiração, revogação e campos mínimos.
- Migrar/absorver os tokens antigos no passaporte unificado, com redirects.
- Página pública de portfólio e contacto no host `www`.
- Formulário público com idempotência, honeypot, rate limit e consentimento.
- SEO, analítica e acessibilidade do site público.
- Backup e monitorização.

**Saída:** leads chegam ao X-Flow, portfólio aprovado é publicado e o cliente recebe um passaporte seguro.

### Fase 2 — Publicação a partir da entrega

Pré-requisitos:

- Persistir fotos de entrega/QC.
- Emitir garantia e certificado.
- Registar consentimento no fecho da obra.
- Gerar derivados e remover EXIF.
- Aprovar antes de publicar.

**Saída:** o Luís publica um trabalho com antes/depois em menos de um fluxo curto, sem edição externa obrigatória.

### Fase 3 — Social Studio

- Copy com guardrails e aprovação humana.
- Partilha manual.
- Geração de imagens 4:5 e 9:16 com templates aprovados.
- Medição de cliques e pedidos.
- Meta/TikTok apenas depois de apps aprovadas, tokens e erros tratados.

**Saída:** conteúdo consistente sem prometer automação que ainda não existe.

### Fase 4 — 3D e vídeo

- Modelo 3D com licença comercial e otimização.
- Fallback estático.
- Captura e armazenamento de clipes.
- Edição e publicação assistidas.

**Saída:** experiência avançada sem comprometer o MVP nem o desempenho.

### Dependências e capacidade

- Tempo do Luís para aprovar conteúdo e responder a leads.
- Fotos originais e autorizações.
- Revisão jurídica.
- Storage e orçamento de infraestrutura.
- Aprovação de apps Meta/TikTok, se avançar.
- Licenças de modelos 3D e fontes.

---

## 8. Critérios de Sucesso e Definição de Concluído

Uma fase só está concluída quando:

1. A decisão B1 e o token unificado estão registados e são conhecidos.
2. O site público e o X-Flow estão isolados por app, host, deploy, layout e sessão.
3. Nenhuma rota pública depende de `AppShell`, `getOptionalAuth` ou dados internos.
4. A matriz de rotas foi testada sem sessão, com sessão e com sessão inválida.
5. O passaporte usa o token unificado, expira e pode ser revogado; não mostra proprietário, VIN, faturas ou quilometragem. Os tokens antigos foram migrados ou redirecionados.
6. O simulador público não mostra matrícula, proprietário, custo, preço ou margem.
7. O formulário grava apenas leads, com idempotência, consentimento e rate limit durável.
8. O lead chega à caixa de gestão e tem primeira resposta registada.
9. O portfólio só publica com consentimento ativo, imagens aprovadas e dados confirmados.
10. As imagens públicas vêm de storage e derivados, sem data URLs.
11. A migração 30 foi aplicada, a RLS está ativa e os testes com GUC estrangeiro passam.
12. Não há dados pessoais em logs, analítica ou URLs.
13. O site cumpre os orçamentos de desempenho e WCAG 2.2 AA definidos no Plano Site v1.1.
14. Nenhuma afirmação de material, cor, garantia, durabilidade ou prazo está sem fonte.
15. O 3D público, se existir, usa modelo licenciado e fallback.
16. As notificações e a monitorização de falhas estão ativas.
17. O backup foi testado e o restauro foi documentado.
18. As apps externas (Meta/TikTok), se usadas, têm tokens, erros e retry tratados.
19. O plano de remoção de conteúdo e revogação de consentimento funciona.
20. O Luís consegue operar o fluxo sem depender de código.

---

## 9. Riscos

| Risco | Probabilidade | Impacto | Mitigação |
| --- | --- | --- | --- |
| B1 arrancar sem separar apps/hosts e partir o ERP | Alta | Alto | Duas apps, projetos Vercel separados e testes de fronteira |
| Código do site indisponível atrasar B1 | Alta | Alto | Exportar/clonar antes de iniciar; reconstruir só com autorização e orçamento |
| Configuração duplicada entre apps divergir | Média | Médio | Partilhar apenas tokens/tipos; CI para as duas apps |
| Migração de tokens antigos quebrar links de clientes | Média | Médio | Mapa de tokens, redirects, período de convivência e sunset |
| Passaporte público expor PII | Média | Alto | Token, DTO mínimo, expiração, revogação |
| Simulador público expor custos e clientes | Média | Alto | DTO sanitizado, carro demo, rota separada |
| Publicar imagens sem autorização | Média | Alto | Consentimento por projeto; bloqueio de publicação |
| Fotos em data URL degradarem o site | Alta | Médio | Storage, derivados, CDN |
| Leads perderem-se sem notificação | Média | Alto | Caixa de leads, alerta, SLA, substituto |
| Spam no formulário | Média | Médio | Rate limit durável, honeypot, Turnstile |
| Tabelas novas sem RLS | Média | Alto | Migração 30, grants mínimos, testes |
| 3D violar licença ou performance | Média | Alto | Manter interno; licença e otimização antes de público |
| Automação Meta/TikTok falhar | Média | Médio | Adiar; tratar tokens, erros e retry |
| Afirmações comerciais não sustentadas | Média | Alto | Registo de afirmações e revisão humana |
| Falta de capacidade do Luís | Alta | Alto | MVP pequeno; fases; não automatizar antes de operar |

---

## 10. Decisões Tomadas e Pendentes

**Tomadas em 25/10/2026:**

- **B1** — site público em `www` e X-Flow em `app`; B2 rejeitada.
- **Token unificado** de passaporte em `passport_access_tokens`, com migração dos tokens antigos.

**Pendentes:**

1. **Consentimento:** quem recolhe autorizações, com que âmbito, validade e processo de remoção.
2. **Portfólio:** começar curado manualmente ou esperar por fotos de entrega/QC.
3. **Storage:** Vercel Blob, S3 ou R2; quem paga e quem administra.
4. **3D e Social Studio:** aceitar adiamento ou escolher uma prioridade.
5. **Afirmações:** validar 90 °C, 8 mm, garantias, películas e materiais por escrito.
6. **Operação:** responsável, SLA, substituto e forma de notificação.
7. **Propriedade:** domínio, repositório, alojamento, backups e contas críticas.
8. **Âmbito do MVP:** aceitar que o primeiro lançamento não inclui automação de redes, vídeo ou 3D público.
9. **Migração de tokens:** confirmar janela, redirects, comunicação aos clientes e data de sunset.
10. **Domínios B1:** confirmar os nomes finais de `www` e `app` antes de configurar DNS e cookies.
11. **Código do site:** exportar/clonar o site atual ou autorizar a reconstrução a partir do plano.
12. **Arquitetura B1:** confirmar duas apps no mesmo repositório e dois projetos Vercel.

---

## 11. Registo de Alterações

| Versão | Data | Alteração |
| --- | --- | --- |
| 1.0 | Outubro de 2026 | Primeira versão: site integrado, portfólio, Social Studio, guião e schema |
| 1.1 | 25 de outubro de 2026 | Decisão A/B, conflito de rotas/layout, passaporte por token com compatibilidade com rotas/tokens existentes, simulador sanitizado, leads sem criação automática, consentimento, storage, RLS (incluindo `site_settings`)/migração 30, correção de afirmações e roadmap faseado |
| 1.2 | 25 de outubro de 2026 | Decisão registada: B1 em duas apps/dois hosts e token unificado de passaporte; transição dos tokens antigos; auditoria da Fase 0 com bloqueios; critérios, riscos e roadmap ajustados |

---

**Resultado pretendido:** um site público com identidade X-Motion, alimentado por trabalho real e consentido, que gera leads qualificadas para o X-Flow e prolonga a relação com o cliente através de um passaporte seguro — sem duplicar o ERP, sem expor dados e sem prometer automação antes de ela existir.
