# Manual de Marca & Padrão Criativo — X-Motion

Documento oficial da identidade visual, tipográfica, cromática e editorial da **X-Motion** (`PPF & Car Wrap`, Barcelos).  
Baseado diretamente na arquitetura visual do site oficial em [`site/src/app/globals.css`](file:///c:/Projetos/x_flow/site/src/app/globals.css) e [`site/src/app/site.css`](file:///c:/Projetos/x_flow/site/src/app/site.css).

> [!IMPORTANT]
> **Regra Única para Futuros Criativos e Páginas**  
> Qualquer novo post, carrossel, capa de Reel, capa de Destaque, apresentação, orçamento visual ou peça de campanha da X-Motion deve importar ou respeitar integralmente os tokens de [`marca/tokens.json`](file:///c:/Projetos/x_flow/marca/tokens.json) e [`marca/brand-base.css`](file:///c:/Projetos/x_flow/marca/brand-base.css).  
> Nunca usar visuais genéricos de IA, gradientes neon, itálicos decorativos, títulos em bold carregado ou emojis dentro de criativos.

---

## 1. Posicionamento e Tom de Voz (pt-PT)

- **Identidade:** Precisão técnica de oficina especializada com apresentação editorial calma e minimalista.
- **Idioma obrigatório:** Português Europeu (`pt-PT`) em todo o copy visível.
- **Voz da marca:** Direta, segura, serena e sem hipérboles comerciais ("o melhor do mundo", "imperdível", "promoção louca"). O trabalho e o cuidado falam por si.
- **Vocabulário oficial:**
  - Usar **"Nosso Espaço"** / **"O Espaço"** na comunicação social, destaques e localização ao cliente (alinhado com *"O NOSSO ESPAÇO · BARCELOS"*).
  - Usar frases curtas, com ritmo de parágrafo limpo, e ênfase numa única ideia por slide ou secção.
- **Fórmula oficial de título:** frase direta em `#f2f2ee` terminando numa palavra-chave ou expressão em destaque dourado (`#c5aa79`, sem itálico):
  - Exemplo do site: *"O seu carro. Uma nova **expressão**."*
  - Exemplo do site: *"A diferença está no **cuidado**."*
  - Exemplo do site: *"O trabalho **fala por si**."*

---

## 2. Logótipo e Assinatura

A X-Motion dispõe de **duas variantes oficiais do logótipo**, ambas com fundo transparente:

- **Logo Oficial Completo (vertical/marca):** [`marca/logo_xmotion_completo.png`](file:///c:/Projetos/x_flow/marca/logo_xmotion_completo.png) — símbolo duplo entrelaçado `XX` acima do wordmark `xmotion`.  
  *Quando usar:* capas verticais, topo de destaques, posts hero/fecho, apresentações, documentos e perfis sociais.
- **Logo Oficial Simples (horizontal/compacto):** [`site/public/logo/logo.png`](file:///c:/Projetos/x_flow/site/public/logo/logo.png) (`2044 × 362 px`) e [`site/public/logo/logo.webp`](file:///c:/Projetos/x_flow/site/public/logo/logo.webp) — apenas wordmark `xmotion` horizontal.  
  *Quando usar:* barra de navegação do site, rodapés estreitos ou assinaturas horizontais onde a altura é reduzida.
- **Subtítulo opcional:** `PPF & car wrap` imediatamente abaixo do logo, em `letter-spacing: 0.21em` a `0.22em`, cinzento `#a7aaa6`.
- **Regras de aplicação:**
  - Usar sempre os ativos gráficos reais do logo nos criativos de marca, capas e peças oficiais — nunca recriar o logo com texto simples nem escrever `X_MOTION` quando existe espaço para o gráfico oficial.
  - Em micro-etiquetas editoriais corridas onde não cabe imagem, escrever `X-MOTION` (com hífen, nunca underscore).
  - Garantir fundo escuro limpo (`#101211`, `#0c0e0d` ou `#171a18`), sem linhas ou texto a cruzar o símbolo, e margem livre equivalente a pelo menos a altura do `x`.

---

## 3. Paleta de Cores Oficial

**Proporção visual recomendada:** `75%–85%` de fundos escuros (`#101211` / `#171a18`) ou secções de papel claro editorial (`#f2f2ee`); máximo `10%–15%` de dourado `#c5aa79` apenas para acento, foco, índice numérico e chamada à ação.

### 3.1 Fundos e Superfícies (Modo Escuro — Principal)

| Token | Hex | Utilização |
| :--- | :--- | :--- |
| `--xm-ink` | `#101211` | Fundo principal da marca, slides, capas e secções base |
| `--xm-ink-deep` | `#0c0e0d` | Fundos Hero, sombreados de legibilidade sobre fotografia |
| `--xm-ink-extreme` | `#0a0d09` | Rodapés profundos e barras de fecho |
| `--xm-charcoal` | `#171a18` | Secções alternadas escuras, comparadores e cartões técnicos |
| `--xm-surface` | `#1b1d1a` | Molduras de fotografia (antes de carregar ou contorno escuro) |
| `--xm-input` | `#191d17` | Caixas de dados e formulários |

### 3.2 Superfícies Claras (Modo Papel — Contraste Editorial)

| Token | Hex | Utilização |
| :--- | :--- | :--- |
| `--xm-paper` | `#f2f2ee` | Secções de leitura clara, listagens e texto principal em escuro |
| `--xm-paper-card` | `#e7e8e2` | Cartões dentro de layouts claros |
| `--xm-paper-note` | `#e5dfcd` | Notas técnicas e blocos informativos em fundo claro |

### 3.3 Dourado Champagne (Assinatura & Ação)

| Token | Hex | Utilização |
| :--- | :--- | :--- |
| `--xm-gold` | `#c5aa79` | Palavra-chave em `<em>`, índices (`01`), ícones ativos, botões primários |
| `--xm-gold-hover` | `#d7be93` | Hover de botões primários |
| `--xm-gold-border` | `#8b7c60` | Borda subtil de CTAs secundários (`nav-cta`) |
| `--xm-gold-border-soft` | `#827257` | Borda de elementos selecionados |

### 3.4 Texto e Linhas Estruturais (Hairlines)

| Token | Valor | Utilização |
| :--- | :--- | :--- |
| Texto principal (sobre escuro) | `#f2f2ee` | Títulos e afirmações principais |
| Corpo secundário (sobre escuro) | `#b8bdb4` / `#a7aaa6` | Parágrafos explicativos |
| Metadados / legendas (sobre escuro) | `#8c9485` | Datas, especificações, notas de rodapé |
| Texto principal (sobre papel) | `#101211` | Títulos e texto chave em secções claras |
| Corpo / eyebrows (sobre papel) | `#454d3f` / `#676b64` / `#77775d` | Subtítulos, corpo e etiquetas sobre `#f2f2ee` |
| Linha divisória (`--line`) | `rgba(255, 255, 255, 0.15)` | Linhas estruturais finas de `1px` em fundo escuro |
| Linha clara | `#cdd1c6` / `#cbd0c2` | Separadores de `1px` em fundo `#f2f2ee` |

---

## 4. Tipografia e Hierarquia

- **Família única:** `Plus Jakarta Sans` (Google Fonts), pesos `300`, `400`, `500`, `600`.
- **Regras invariáveis:**
  - **Títulos display (`h1`, `h2`, `h3`):** peso `400` no site (`300` ou `400` em peças gráficas), **nunca** `700`/`800`, com tracking apertado (`-0.052em` a `-0.065em`) e entrelinha justa (`0.96` a `1.08`).
  - **Ênfase em título (`<em>`):** `font-style: normal` (sem itálico) e cor `#c5aa79`.
  - **Eyebrows e códigos de secção:** caixa alta (`uppercase`), peso `500`, `letter-spacing: 0.14em` a `0.21em`, com separador dourado `3px × 3px` (`■`) ou barra numérica (`01 / ...`).
  - **Corpo:** peso `400`, entrelinha generosa (`1.6` a `1.9`).
  - **Numerais:** usar `font-variant-numeric: tabular-nums` em contadores, datas, especificações (`200 microns`, `01 / 05`) e valores.

---

## 5. Geometria, Grelha e Fotografia

- **Cantos vivos (`border-radius: 0px`):** todo o sistema usa arestas arquitetónicas retas em fotos, cartões, botões e caixas de nota. Únicas exceções:
  - Pills de filtro (`30px`),
  - Amostras de cor, avatares e miniaturas circulares de Destaques (`50%`).
- **Linhas de precisão (`1px`):** usar divisórias horizontais e verticais finas para organizar informação em vez de caixas com sombra ou fundos pesados.
- **Fotografia real do carro:**
  - Priorizar fotos e vídeos reais gravados no espaço da X-Motion (luz limpa de oficina, reflexos controlados, ângulo de 3/4, detalhe de vinco/borda, tejadilho).
  - Aplicar vinheta/sombra `#0c0e0d` gradual apenas onde o texto sobrepõe a foto (`brightness(0.88–0.92)` quando há texto por cima).
  - Proibido adicionar stickers, setas berrantes, brilhos artificiais ou sobreposições coloridas fora da paleta.

---

## 6. Padrão para Redes Sociais (`@x_motion.wrap`)

### 6.1 Formatos & Zonas Seguras
- **Feed / Carrossel:** `1080 × 1350 px` (`4:5`), margem interior confortável (`72–88 px`), máximo **1 ideia + 25–40 palavras por slide**, sem poluição visual.
- **Reels / Stories / Capas de Destaque:** `1080 × 1920 px` (`9:16`).
  - Nos **Reels**, evitar texto nos `220 px` superiores e nos `380 px` inferiores; enquadrar o título da capa também para caber no corte `1:1` / `4:5` do feed.
  - Nas **Capas de Destaque**, manter o símbolo centrado dentro de `780 × 780 px` para leitura nítida no círculo de miniatura do perfil.

### 6.2 Barra Oficial dos 6 Destaques
Ordem exata da esquerda para a direita (ordem de decisão de cliente):
1. **Orçamento** *(Pedido rápido em 3 passos -> link sem fugas `https://<dominio>/ig`)*
2. **PPF** *(Paint Protection Film · 200 Microns)*
3. **Color PPF** *(Cor exclusiva + proteção física)*
4. **Car Wrap** *(Revestimento integral & detalhe)*
5. **Prova** *(Entregas, parceiros & feedback)*
6. **Nosso Espaço** *(Pavilhão 4D · Barcelos, Braga)*

### 6.3 Fluxo Obrigatório de Produção de Conteúdo
1. Extrair base real (carro, processo, dúvida de cliente ou comparativo técnico).
2. Aplicar os tokens de [`marca/tokens.json`](file:///c:/Projetos/x_flow/marca/tokens.json) + [`marca/brand-base.css`](file:///c:/Projetos/x_flow/marca/brand-base.css).
3. Validar sempre visualmente as imagens finais antes de aprovar ou publicar (verificar contraste, alinhamento, pt-PT e ausência de bugs de texto/unidades).
4. **Nunca publicar automaticamente** sem confirmação explícita do utilizador.

