# Critérios e notas do Raio-X

Leia antes de dar qualquer nota. Toda nota precisa de **evidência** (o que você viu no print ou
o número do `metricas.json`) e do **critério** que ela atendeu ou não. Nota sem evidência não
entra no relatório.

## Regras gerais das notas

- Escala de 0 a 10, número inteiro. Faixas que o relatório mostra: 0 a 4 Crítico, 5 e 6
  Atenção, 7 e 8 Bom, 9 e 10 Forte.
- Dê a nota pela faixa que descreve melhor o perfil e ajuste 1 ponto para cima ou para baixo
  conforme o que sobra. Não dê 10 se houver qualquer item da lista "o que conferir" faltando.
- Área sem dado suficiente recebe `"nota": null` e o `o_que_vimos` explica o que faltou
  (ex.: engajamento no modo prospect sem nenhuma curtida visível). Ela sai da média.
- Compare o perfil **com ele mesmo** (mediana dos próprios posts, formatos entre si, antes e
  depois) e com concorrentes **medidos da mesma forma**. Não use "média de mercado",
  "taxa ideal de engajamento" ou qualquer benchmark externo: esses números não são
  confiáveis, mudam com nicho, tamanho e época, e o aluno não consegue conferir.
- Escreva a evidência com números e citações curtas: "7 dos 12 posts sem chamada",
  "bio: 'Movimento é vida'". Nada de "parece", "talvez" sem dizer o que falta para saber.

## Nota geral

O script calcula a média ponderada das 11 áreas com pesos pelo objetivo do perfil (o
relatório mostra os pesos). Você não calcula a nota geral.

| Área | vender-servico | crescer | lancar | clientes-locais |
|---|---|---|---|---|
| Primeira impressão | 1,5 | 1 | 1 | 1,75 |
| Destaques | 1 | 0,5 | 1 | 1,25 |
| Grade | 0,5 | 0,75 | 0,5 | 0,5 |
| Mix de formatos | 0,75 | 1,5 | 1 | 0,75 |
| Frequência e constância | 0,75 | 1,5 | 1 | 0,75 |
| Posicionamento e pilares | 1 | 1,25 | 1 | 1 |
| Ganchos | 1 | 2 | 1,25 | 1 |
| Chamadas para ação | 1,25 | 0,75 | 1,5 | 1,25 |
| Caminho até a venda | 2 | 0,5 | 1,5 | 1,75 |
| Prova social | 1,5 | 0,5 | 1,5 | 1,5 |
| Engajamento | 1 | 1,5 | 1,25 | 0,75 |

## As 11 áreas

### 1. Primeira impressão (`primeira_impressao`)
O que conferir:
- **Foto**: reconhecível no círculo pequeno (rosto próximo, ou símbolo simples sem texto
  miúdo). Perfil pessoal ou negócio que é a própria pessoa: rosto. Marca: símbolo.
- **Nome** (campo Nome, que entra na busca): tem a palavra que o cliente digitaria (serviço,
  assunto) e, se for negócio local, cidade ou bairro. O @ é fácil de falar e escrever.
- **Bio em 3 informações** (método do curso): assunto, modo de ajudar, próximo passo. Diz
  para quem é. Prova só se for real (anos, clientes, resultado verificável).
- **Link**: leva direto ao próximo passo prometido na bio (WhatsApp com mensagem pronta,
  agenda, página da oferta). Poucas opções. Funciona no celular.

Faixas:
- 9 a 10: em 3 segundos dá para dizer para quem é, o que resolve e o que fazer; nome
  pesquisável; foto clara; link com 1 a 3 opções coerentes com a bio.
- 7 a 8: bio clara, mas falta um elemento (prova ou próximo passo específico), ou link com
  opções demais.
- 5 a 6: o assunto aparece, mas não diz para quem é nem o próximo passo; nome sem palavra
  de busca.
- 3 a 4: bio de frases de efeito, chamada genérica ("agende já") e link genérico.
- 0 a 2: sem bio útil, sem link, foto ilegível ou perfil que parece abandonado.

### 2. Destaques (`destaques`)
O que conferir: existem; respondem às perguntas de quem está decidindo (sobre, serviços ou
produtos, como funciona, provas e depoimentos, resultados, dúvidas frequentes e, se for
local, como chegar); capas legíveis e no mesmo padrão; nomes curtos e claros (não só emoji);
ordem do mais útil para decidir ao menos útil; conteúdo atual (nada de datas vencidas em
primeiro).

Faixas: 9 a 10 vitrine completa, atual e organizada · 7 a 8 falta 1 tema importante ou capas
irregulares · 5 a 6 tem 2 ou 3 destaques úteis misturados com antigos · 3 a 4 destaques
genéricos ("fotos", datas) sem oferta nem prova · 0 a 2 sem destaques.

### 3. Grade (`grade`)
O que conferir: olhando só os 9 a 12 primeiros quadrados dá para entender o assunto; capas
com título curto e legível no tamanho da grade (a grade recorta os posts na vertical, 3:4 na
realidade de setembro de 2026: texto no centro); identidade reconhecível (2 ou 3 cores, 1 ou 2
fontes, mesmo estilo de foto) sem virar monotonia; posts fixados (até 3) usados para
apresentar, provar e ofertar.

Faixas: 9 a 10 assunto óbvio e capas legíveis em quase todos · 7 a 8 maioria legível, 2 ou 3
quadrados "mudos" · 5 a 6 identidade ok, mas metade das capas não diz o assunto · 3 a 4 grade
confusa, texto ilegível · 0 a 2 sem padrão nem assunto reconhecível.

### 4. Mix de formatos (`formatos`)
Use o mix e as medianas por formato do `metricas.json`. Critério (máquina do alcance do
curso): Reels para alcance, carrossel para engajamento e salvamentos, Stories para conexão e
conversão, Destaques para autoridade, estático como vitrine. Confira se a proporção combina
com o objetivo (crescer pede Reels constantes; vender e local pedem também prova e
demonstração) e se o formato que dá melhor resultado **no próprio perfil** é o mais usado.
Veja se aparecem os formatos super virais do curso (tela dividida, quadro "não ignore",
diálogo de pergunta e resposta, transformação "isso em isso") quando cabem no nicho.

Faixas: 9 a 10 cada formato com função clara e proporção coerente · 7 a 8 falta um formato
útil · 5 a 6 o formato que mais funciona é pouco usado · 3 a 4 quase tudo num formato só que
rende pouco · 0 a 2 sem variedade e sem resultado.

### 5. Frequência e constância (`frequencia`)
Use `posts_semana`, `maior_intervalo` e `dias_desde_ultimo_post`. Referência de
planejamento do curso (não é regra do algoritmo): mínimo de 3 posts por semana, ideal 1 por
dia, teto de 3 por dia; nichos de notícia e entretenimento pedem mais, nichos de conteúdo
mais aprofundado, 3 a 5 por semana. Pergunte a rotina real: 3 posts sustentáveis valem mais
que 7 abandonados. Stories: pergunte ao aluno (não dá para ver no print).

Faixas: 9 a 10 ritmo no ideal e regular · 7 a 8 3 a 4 por semana regulares · 5 a 6 2 a 3 por
semana ou com buracos de mais de 10 dias · 3 a 4 menos de 2 por semana · 0 a 2 parado há
mais de 30 dias.

### 6. Posicionamento e pilares (`posicionamento`)
Tente completar, só olhando o perfil: "Ajudamos [público] a [progresso] com [abordagem]".
Liste os pilares de conteúdo que você identificou (coluna `pilar` do CSV; o script dá a %).
Avalie o nicho pelos **3 pilares de um nicho vencedor** do curso, separando evidência de
hipótese: interesse e facilidade de criar (há matéria-prima recorrente?), demanda (há
perguntas reais, comentários, procura?) e potencial de monetização (o conteúdo conversa com o
que se vende?). Não invente volume de busca.

Faixas: 9 a 10 frase de posicionamento óbvia, 3 ou 4 pilares ligados à oferta · 7 a 8 claro,
mas com 1 pilar solto · 5 a 6 assunto reconhecível, mas o que funciona é minoria no feed ·
3 a 4 temas espalhados · 0 a 2 sem assunto definido.

### 7. Ganchos (`ganchos`)
O que conferir: texto da capa, primeira linha da legenda e 3 primeiros segundos dos Reels
(pergunte ao aluno ou veja o print do começo do vídeo). Bom gancho mostra uma situação que o
público reconhece ou uma promessa clara; tipos do curso: choque, pergunta, problema com
solução, comparação "A ou B?", impacto visual. A entrega precisa cumprir (gancho sem entrega
é clique vazio). Retenção, quando houver: acima de 1/3 da duração é bom sinal.
Cite 2 ou 3 ganchos reais do perfil, um bom e um ruim.

Faixas: 9 a 10 quase toda peça abre com situação ou promessa clara · 7 a 8 bons ganchos na
maioria · 5 a 6 alguns bons, muitos genéricos ("bom dia", "você sabia?") · 3 a 4 quase nenhum
gancho · 0 a 2 aberturas sem relação com o conteúdo.

### 8. Chamadas para ação (`ctas`)
Use `pct_sem_cta` e a lista de CTAs. Critério: uma chamada por peça, ligada ao que acabou de
acontecer e à função (educativo pede salvar; conversa pede comentar; prova e oferta pedem
direct ou link). Nada de três pedidos juntos nem chamada no meio do carrossel.

Faixas: 9 a 10 toda peça com 1 chamada coerente · 7 a 8 maioria com chamada · 5 a 6 metade
sem chamada · 3 a 4 mais da metade sem chamada ou chamadas soltas · 0 a 2 nenhuma.

### 9. Caminho até a venda (`caminho_venda`)
Siga o caminho como um cliente: bio, link, direct ou WhatsApp, oferta. Cada passo existe? A
oferta está visível (o que é, para quem, como funciona, como começar)? Com Insights, use
`toques_por_visita` (toques no link ÷ visitas ao perfil) e compare com o próximo Raio-X, não
com "média". No modo prospect, diga que essa conta entra na auditoria completa.

Faixas: 9 a 10 caminho de 1 ou 2 toques até a conversa, oferta clara em destaque e fixado ·
7 a 8 caminho claro, oferta pouco visível · 5 a 6 caminho existe, mas com desvios · 3 a 4 link
genérico e oferta invisível · 0 a 2 não dá para comprar ou falar com o negócio.

### 10. Prova social (`prova_social`)
O que conferir: depoimentos (com autorização), resultados reais, bastidores de atendimento,
números reais (clientes, anos), parcerias; onde aparecem (destaque, fixados, Reels). Nunca
sugira prova inventada: se faltar, a correção é **coletar** (roteiro de pedido de depoimento).

Faixas: 9 a 10 prova recorrente e fácil de achar · 7 a 8 prova existe, pouco organizada ·
5 a 6 1 ou 2 provas soltas · 3 a 4 prova escondida ou quase nenhuma · 0 a 2 nenhuma.

### 11. Engajamento (`engajamento`)
Use só as fórmulas do `metricas.json` e declare qual:
- **Com Insights (por alcance)**: interações ÷ contas alcançadas; sinal de utilidade =
  (salvamentos + compartilhamentos) ÷ alcance; contas com engajamento ÷ contas alcançadas.
- **Só público (estimativa por seguidores)**: (curtidas + comentários) ÷ seguidores. Marque
  como estimativa. No modo prospect, prefira `"nota": null` e explique, ou dê nota apenas se
  houver padrão muito claro e diga que é estimativa.

Critério sem benchmark: dispersão entre os posts (poucos acima e muitos abaixo da mediana
indica dependência de acertos isolados), qualidade da interação (salvamentos,
compartilhamentos e comentários com pergunta pesam mais que curtida), formatos e pilares que
ficam acima da mediana, evolução em janelas iguais (7 dias após cada post) quando houver
histórico.

Faixas: 9 a 10 interação útil consistente em vários formatos e conversa nos comentários ·
7 a 8 bom em 1 ou 2 formatos · 5 a 6 depende de poucos posts, metade do feed só gera curtida ·
3 a 4 quase nenhuma interação útil · 0 a 2 sem interação.

## Os posts que mais e menos funcionaram

O script dá `top` e `bottom` pela métrica principal, e também `top_alcance` e `top_util`.
Escreva o **padrão**, não a lista: o que os melhores têm em comum (assunto, formato, gancho,
capa, chamada) e o que falta nos piores. Escolha a métrica pela função da peça (curso):
descoberta olha alcance e não seguidores; utilidade olha salvamentos e compartilhamentos;
oferta olha toques no link e conversas. Separe o que os dados mostram de hipótese. Amostra
pequena (12 posts) não prova nada sobre "o algoritmo": proponha o próximo teste mudando uma
variável só.

## Concorrentes

Mesma conta pública para todos (o script faz). Compare o que é visível: bio, nome, destaques,
formatos, frequência, moldes que aparecem. Use o algoritmo reverso do curso: copie o molde,
não o conteúdo. Registre que não sabemos o alcance real nem se houve impulsionamento.
