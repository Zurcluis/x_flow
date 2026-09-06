# Catálogos oficiais de películas — X-Flow

Descarregados a 06/09/2026 a partir das fontes oficiais. São a fonte de verdade para
`scripts/seed-films.mjs` (catálogo da tabela `films`) e para os parâmetros de simulação
(`src/lib/film-simulation.ts`: GU, metallic, flake).

| Ficheiro | Marca | Fonte |
| --- | --- | --- |
| `3m-2080-bulletin.pdf` | 3M Wrap Film Series 2080 (Product Bulletin set/2024) | multimedia.3m.com/mws/media/1711255O/2080-bulletin-rc-pdf.pdf |
| `avery-sw900-catalogo-cores.pdf` | Avery Dennison SW900 Supreme Wrapping Film (swatch poster) | graphics.averydennison.com/…/supreme-wrapping-film-color-swatch-poster.pdf |
| `avery-sw900-pds.pdf` | Avery Dennison SW900 Product Data Sheet | graphics.averydennison.com/…/pds-sw-900-wrapping-film.pdf |
| `xpel-ultimate-plus-tds.pdf` | XPEL ULTIMATE PLUS PPF TDS | xpel.com/product-specifications |
| `xpel-stealth-tds.pdf` | XPEL STEALTH (satin) PPF TDS | xpel.com/product-specifications |
| `xpel-color-ppf-gloss-tds.pdf` | XPEL COLOR PPF Gloss TDS | xpel.com/product-specifications |
| `xpel-color-ppf-satin-tds.pdf` | XPEL COLOR PPF Satin TDS | xpel.com/product-specifications |
| `stek-dynoshield-tds.pdf` | STEK DYNOshield TDS | via api-shop.spandex.com (TDS oficial STEK) |
| `stek-dynomatte-tds.pdf` | STEK DYNOmatte TDS | stekautomotive.com.ua (espelho oficial) |
| `kpmf-catalogo-2023.pdf` | KPMF (ORAFOL) Product Catalogue 2023 | orafol.com/fileadmin/user_upload/kpmf_catalogue_2023_interactive__1_.pdf |

Inozetek não publica PDF público — fontes usadas (páginas oficiais):

- INOcolor (Color PPF): https://www.inozetek.com/dynamic-ppf/inocolor — garantia 10 anos
- TDS DPPF910 (Canada): https://www.inozetek.ca/products/dynamic-ppf-carbon-fiber-gloss-dppf910 — **Gloss >85 GU**, TPU 7.82 mil
- Wrap SuperGloss: https://www.inozetek.com/vinyl-wrap/msg025-metallic-midnight-purple — `MSG025 Metallic Midnight Purple`
- Garantia wrap (limitada, OEM ≤8 anos): https://www.inozetek.com/warranty/vinyl-wrap

## Dados verificados vs. seed anterior

| Película | Correção face ao seed anterior |
| --- | --- |
| 3M 2080 Gloss Black | código **G12** (antes `M12`); garantia 7 anos |
| 3M 2080 Matte Deep Black | código **M22** (antes `M226`) |
| 3M 2080 Matte Blue Metallic | **novo** — código **M227** (antes M227 estava atribuído a "Satin Dark Grey", errado) |
| Avery SW900 Gloss Black | código **SW900-190-O** (antes `SW900-183` "Nardo Grey" não existe no catálogo NA) |
| Avery SW900 Gloss Dark Grey | código **SW900-865-O** |
| Avery SW900 Matte Black | código **SW900-180-O** (antes `SW900-127` não confirmado) |
| Avery SW900 Matte Metallic Anthracite | código **SW900-858-M** (antes `SW900-127`) |
| XPEL Ultimate Plus / Stealth | sem alteração — 10 anos ✓ |
| STEK DYNOshield | **garantia 12 anos** (site oficial, antes 10) |
| Inozetek Metallic Midnight Purple | código wrap real **MSG025** (antes `SGP605` inventado) |
| Inozetek Super Gloss Nardo Grey | código **SG004** (antes `SGR615` inventado) |
| Inozetek INOcolor DPPF901/DPPF809 | **novos** Color PPF (10 anos, gloss >85 GU) |
| KPMF Matt Anthracite | código real **K75320** Cast VWS IV (antes `M05382` inventado) |

## Notas de simulação

- Cores hex aproximadas a partir da fotografia de produto/amostras — afinar com leitura
  colorimétrica (L*a*b*) das amostras físicas quando disponíveis.
- GU: Inozetek DPPF >85 GU (TDS); DYNOshield "ultra gloss" ~93 GU; Stealth/DYNOmatte matte ~11-12 GU;
  wraps gloss ~85 GU, satin ~25-35 GU, matte ~10-14 GU. Valores usados como `gloss_gu` na tabela `films`.
- Garantias: 3M 7 anos; Avery SW900 7 anos; XPEL 10 anos; STEK DYNOshield 12 anos / DYNOmatte 10;
  INOcolor 10 anos; KPMF 7 anos.
