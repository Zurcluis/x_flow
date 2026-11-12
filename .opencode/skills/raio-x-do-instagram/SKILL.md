---
name: raio-x-do-instagram
description: 'Auditoria e raio-x de perfil de Instagram: nota 0-10 por área (foto, nome, bio, link, destaques, grade, formatos, frequência, pilares, ganchos, CTAs, caminho até a venda, prova social, engajamento), posts que mais e menos funcionaram, comparação com concorrentes, 5 problemas prioritários com correção, 3 bios reescritas, calendário de 30 dias, 15 ideias com gancho e 3 roteiros de Reels GPEC, em PDF. Use quando pedirem "analisa meu Instagram", "raio-x do perfil", "auditoria de Instagram", "por que o perfil não cresce", "avalia o Instagram do cliente", "diagnóstico do perfil", "o que mudar na bio", ou enviarem prints de um perfil a pedir opinião.'
license: 'Uso dos alunos Mestres da IA. Fontes Inter e Sora sob SIL Open Font License 1.1 (assets/fontes/OFL.txt).'
compatibility: 'App do Claude (chat) com execução de código ativada, Cowork ou Claude Code. Python 3 com reportlab para o PDF; sem reportlab, gera HTML para salvar como PDF. Melhor ainda com o Claude no Chrome para ler um perfil com o aluno logado.'
metadata:
  versao: '1.0'
  atualizado: '2026-09-29'
  metodo: 'Curso Ruptura Viral IA (Mestres da IA)'
---

# Raio-X do Instagram

Você recebe prints de um perfil de Instagram (ou lê o perfil no Chrome com o aluno logado) e
devolve uma auditoria que o aluno pode entregar a um cliente ou vender como serviço:

| Entrega | Arquivo |
|---|---|
| Relatório completo: capa, nota geral e por área, 5 problemas com correção, números com fórmula, concorrentes, 3 bios, destaques, calendário de 30 dias, 15 ideias, 3 roteiros GPEC, ficha de medição | `raio-x-<perfil>.pdf` (plano B: `.html`) |
| Versão curta para mandar no WhatsApp | `resumo-whatsapp.txt` |
| Modo prospect: mensagem oferecendo a auditoria completa | `mensagem-abordagem.txt` |

O método é o do curso Ruptura Viral IA: posicionamento pelos 3 pilares de um nicho vencedor,
bio em 3 informações, GPEC (Gancho, Promessa, Entrega e CTA), formatos super virais,
algoritmo reverso e métricas com denominador. Resumo em `references/metodo-ruptura.md`.

## Arquivos desta skill

- `references/coleta.md`: lista de prints para pedir, como ler cada print, colunas do
  `posts.csv` e campos do `perfil.json`, fatos do Instagram e regras do modo Chrome.
- `references/criterios.md`: o que conferir em cada uma das 11 áreas, faixas de nota, pesos
  da nota geral por objetivo e como ler engajamento sem benchmark. Leia antes de dar nota.
- `references/metodo-ruptura.md`: a régua do curso.
- `references/entregas.md`: como escrever cada peça do relatório, o formato do `raio-x.json`,
  a versão para WhatsApp, a abordagem de prospect e como o aluno vende a auditoria.
- `modelos/`: `posts-exemplo.csv`, `perfil-exemplo.json` e `raio-x-exemplo.json`, um caso
  fictício completo (@studiolunapilates). Copie a estrutura; nunca copie os números.
- `scripts/contas.py`: calcula todas as taxas a partir da tabela. `scripts/gerar_relatorio.py`:
  confere o `raio-x.json` e gera PDF, resumo e abordagem.
- `assets/fontes/`: fontes do relatório (Inter e Sora, licença OFL).

## Como falar com o aluno

Português do Brasil, direto, sem termos técnicos ("rodar o script", "JSON" e "CSV" ficam por
dentro). Diga o que está fazendo em uma linha por etapa. Não peça aprovação a cada passo: pare
só quando faltar algo que muda o resultado.

## Passo 1 · Entender o pedido

Descubra, numa mensagem só, o que ainda não sabe (o que já veio no pedido, não pergunte):

1. **De quem é o perfil**: do próprio aluno, de um cliente (com acesso aos Insights) ou de um
   prospect (só dados públicos).
2. **Objetivo**: vender um serviço, crescer, preparar um lançamento ou atrair clientes locais.
3. **Nicho e público** em uma frase; **cidade ou bairro** se for negócio local.
4. **Oferta e próximo passo**: o que vende e como o cliente começa (orçamento, aula
   experimental, agenda, link de compra).
5. **Capacidade**: quem grava, quantas horas por semana, quem edita.
6. **Quem assina o relatório**: nome, função e contato do aluno; cor da marca (opcional).
7. **Concorrentes** (opcional): 2 ou 3 @.

Se os prints ainda não vieram, mande a lista curta de `references/coleta.md` (topo do perfil,
grade com 12 a 30 posts, números de cada post, Insights de 30 dias, legendas e contexto).

**Realidade de setembro de 2026**: o Instagram não abre perfis para leitura automática sem
login, então não tente buscar o perfil pela web nem use sites que "raspam" perfis. No chat,
trabalhe com prints. Com o Claude no Chrome e o aluno já logado, você pode navegar no perfil e
ler o que está visível, seguindo as regras do modo Chrome em `references/coleta.md` (sem login
por ele, sem curtir, seguir, comentar ou mandar mensagem).

## Passo 2 · Ler os prints e montar a tabela

Crie uma pasta de trabalho (ex.: `raio-x-<perfil>-<AAAA-MM-DD>/`) e escreva nela:

- `posts.csv`: um post por linha, do mais recente (P01) para o mais antigo, com as colunas de
  `references/coleta.md`. Copie os números e as datas como aparecem ("12,4 mil", "há 2 dias"
  servem). Número ilegível, oculto ou coberto fica **vazio**: nunca estime, mesmo que pareça
  dar para adivinhar. Se ele aparece legível em outro print, use o outro.
- `perfil.json`: dados do topo, Insights, contexto, concorrentes e quem assina. Use
  `modelos/perfil-exemplo.json` como forma.

Classifique cada post: `formato`, `tema`, `pilar` (3 a 6 pilares que você identificar no
perfil), `gancho` (texto da capa ou primeira linha) e `cta` (nenhum, salvar, comentar,
compartilhar, direct, link, seguir).

Mostre ao aluno em até 5 linhas o que leu (perfil, período, quantos posts, números dos
Insights) e quais números ficaram de fora. Só pare para perguntar se um número decisivo ficou
ilegível.

## Passo 3 · Fazer as contas (sempre pelo script)

```bash
python3 <pasta-da-skill>/scripts/contas.py --pasta <pasta-de-trabalho>
```

O script grava `metricas.json` e imprime o resumo: taxas por post com fórmula, mediana do
perfil, índice de cada post contra a mediana, mix e medianas por formato e pilar, frequência,
maior intervalo, posts sem chamada, retenção dos Reels, top e piores, indicadores dos Insights
e a comparação pública com concorrentes. Use **só** esses números no texto. Não calcule taxa
de cabeça.

- Com Insights, a base é o alcance. Só com dados públicos, a base é seguidores e tudo é
  **estimativa** (o relatório avisa).
- Para ranquear por outra métrica: `--metrica util_alcance` (salvamentos + compartilhamentos
  por alcance), `alcance`, `taxa_seguidores` ou `views_por_seguidor`.

Se não souber o caminho da skill: `find / -name contas.py -path "*raio-x-do-instagram*" 2>/dev/null | head -1`.

## Passo 4 · Diagnóstico por área

Leia `references/criterios.md`. Para cada uma das 11 áreas (primeira impressão, destaques,
grade, mix de formatos, frequência, posicionamento e pilares, ganchos, chamadas para ação,
caminho até a venda, prova social, engajamento):

- `nota` de 0 a 10 pela faixa do critério (ou `null` se não houver dado);
- `o_que_vimos`: evidência com número ou citação curta;
- `por_que`: qual critério foi ou não atendido;
- `o_que_fazer`: ação concreta.

Depois escreva o padrão dos posts que mais e menos funcionaram (o que têm em comum, não a
lista) e, se houver concorrentes, a leitura comparativa e os moldes a adaptar (algoritmo
reverso: copie o molde, não o conteúdo). A nota geral é calculada pelo script com pesos pelo
objetivo; não calcule.

## Passo 5 · Plano de ação e peças prontas

Siga `references/entregas.md` para escrever: os 5 problemas que mais custam com a correção,
nome pesquisável, 3 bios (até 150 caracteres cada, sem emoji), link, destaques, posts fixados,
plano de 30 dias (formato e pauta por dia, cabendo na capacidade real), 15 ideias com gancho,
3 roteiros de Reels no GPEC (fala, ação visual, texto na tela, tempos), próximos passos,
versão para WhatsApp e, no modo prospect, a mensagem de abordagem.

Qualidade de agência: cada frase precisa ser específica deste perfil. Se trocar o @ e o texto
continuar servindo para qualquer perfil, reescreva.

## Passo 6 · Gerar o relatório

Salve tudo em `<pasta-de-trabalho>/raio-x.json` (forma em `modelos/raio-x-exemplo.json`) e rode:

```bash
python3 <pasta-da-skill>/scripts/gerar_relatorio.py --pasta <pasta-de-trabalho> --previa
```

- O script confere o `raio-x.json` (5 problemas, 3 bios até 150 caracteres, 30 dias, 15
  ideias, 3 roteiros com G, P, E e C, abordagem no modo prospect) e lista o que corrigir.
  Corrija e rode de novo; não use `--forcar` para esconder erro.
- Saída em `<pasta-de-trabalho>/entrega/`: o PDF, `resumo-whatsapp.txt` e, no prospect,
  `mensagem-abordagem.txt`. `{nota_geral}` nos textos vira a nota calculada.
- Sem reportlab no ambiente, o script gera o HTML automaticamente (plano B): o aluno abre no
  navegador e usa Imprimir > Salvar como PDF. Para forçar: `--formato html`.
- `--previa` gera PNG das páginas quando o ambiente permite (PyMuPDF, pdftoppm ou qlmanage).
  Olhe ao menos a capa, o resumo e o calendário antes de entregar.

No app do Claude, copie os arquivos finais para a pasta de arquivos para download do ambiente
(costuma ser `/mnt/user-data/outputs/`) e entregue os links.

## Passo 7 · Entregar

Na resposta final ao aluno:

1. Os arquivos (PDF, resumo, abordagem).
2. Em 5 linhas: nota geral, os 3 problemas que mais custam e o que fazer nesta semana.
3. O texto do WhatsApp num bloco pronto para copiar.
4. A lista de `[CONFIRMAR]` que o dono do perfil precisa responder antes de publicar as
   mudanças.
5. No modo prospect: a mensagem de abordagem e o lembrete de que **ele** envia, uma por vez,
   para o contato comercial público da empresa, e para ali se a resposta for não.

## Regras que não mudam

- **Nenhum número inventado.** Todo número vem do print ou do `metricas.json`. O que falta
  vira pergunta ou `[CONFIRMAR: ...]`.
- **Sem benchmark.** Nada de "média de mercado" ou "taxa ideal". Compare o perfil com ele
  mesmo e com concorrentes medidos igual, e ensine o critério.
- **Fórmula declarada** em toda taxa. Dado público é estimativa e aparece assim.
- **Sem promessa** de seguidores, alcance, vendas ou faturamento. Sem escassez falsa.
- **Prova só real.** Depoimento só com autorização; número de clientes só se o dono confirmar.
- **Saúde, finanças, direito e estética**: nada de promessa de cura, ganho ou resultado;
  oriente a procurar o profissional quando for o caso.
  Regra legal, fiscal ou de conselho profissional que muda (limite, prazo, valor de guia,
  o que pode anunciar) não entra de cabeça em roteiro nem ideia: vai como
  `[CONFIRMAR: regra vigente]` para o dono do perfil conferir.
- **Prospect**: só perfis comerciais e dados públicos. Não colete nem cite dados de seguidores
  ou de quem comentou. Nada de mensagens em massa.
- **Você não publica, não envia e não interage** no Instagram (curtir, seguir, comentar, direct).
- Fatos da plataforma (limites, nomes de métricas, recursos) aparecem como "realidade de
  setembro de 2026, confira no app".
- Resultado de um perfil não vira regra para outro ("carrossel sempre ganha"): vira hipótese
  para testar.

## Se algo der errado

- **Sem execução de código no chat**: peça ao aluno para ativar a execução de código e
  criação de arquivos nas configurações do app (realidade de setembro de 2026, o nome pode
  mudar). É o que garante contas certas e o PDF.
- **Fontes não carregam**: o script usa Helvetica e segue.
- **Print cortado ou de baixa resolução**: peça outro só da parte que faltou.
- **Perfil com curtidas ocultas**: use comentários e visualizações e diga no relatório.
- **Menos de 6 posts ou perfil novo**: faça o raio-x mesmo assim, com notas `null` onde não há
  dado, e foque o plano em vitrine e primeiros testes.
