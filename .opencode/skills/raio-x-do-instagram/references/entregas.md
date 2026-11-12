# Entregas: como escrever cada peça do relatório

Tudo o que você escreve vai para o `raio-x.json` (modelo completo e preenchido em
`modelos/raio-x-exemplo.json`). O script confere quantidades e limites antes de gerar o PDF
e lista o que falta. Escreva para o dono do perfil ler: frases curtas, números do
`metricas.json`, nada de jargão ("CTA" pode, explicado como "chamada").

## Campos do raio-x.json

```
data_relatorio        "AAAA-MM-DD"
resumo                diagnostico (3 a 5 frases), pontos_fortes (3), maior_oportunidade (1 a 2 frases)
areas                 as 11 áreas: nota (0 a 10 ou null), o_que_vimos, por_que, o_que_fazer
engajamento           padrao_melhores, padrao_piores, leitura
concorrentes          leitura, modelar (3 a 5 itens)            (só se houver concorrentes)
problemas             exatamente 5: titulo, evidencia, por_que_custa, correcao (lista de passos), esforco
nome_sugerido         o campo Nome pesquisável
bios                  exatamente 3: texto (até 150 caracteres), prioriza, observacao (opcional)
link_sugerido         o que aparece como link na bio; link_sugerido_explicacao
destaques             4 a 7: nome, capa, conteudo
posts_fixados         até 3 frases
plano_30_dias         inicio (AAAA-MM-DD, de preferência uma segunda-feira), rotina, dias (30)
ideias                exatamente 15: pauta, gancho, formato, pilar
roteiros              exatamente 3: titulo, formato, duracao, objetivo, blocos (Gancho, Promessa,
                      Entrega, CTA com tempo, fala, visual, texto_tela), legenda, por_que_funciona
proximos_passos       4 a 6 frases
whatsapp              versão curta (até ~1.200 caracteres); use {nota_geral} para a nota
abordagem             só no modo prospect (até ~700 caracteres)
```

Use `**negrito**` com moderação. Tudo que depende de confirmação do dono vai como
`[CONFIRMAR: o quê]`; o PDF destaca em amarelo e o script lista no fim.

## Resumo

- **Diagnóstico**: o que funciona, onde o perfil perde gente e o que vem primeiro. Sem
  adjetivo vazio ("incrível", "fraco"). Termine com a prioridade.
- **Pontos fortes**: 3, cada um com evidência (número ou exemplo). Todo perfil tem algo que
  funciona; ache e mostre, porque é o que o dono vai querer repetir.
- **Maior oportunidade**: uma só, a que destrava o objetivo.

## Os 5 problemas que mais custam

Ordene por impacto no objetivo (use os pesos da nota geral como guia) e, em empate, pelo
esforço menor. Cada problema:
- `titulo`: a consequência em linguagem do dono ("O perfil não diz para quem é").
- `evidencia`: o que você viu, com número ou citação.
- `por_que_custa`: o que o dono perde (visitas que não viram contato, alcance que não volta).
  Não invente valor em dinheiro nem número de clientes perdidos.
- `correcao`: 2 a 4 passos que dá para fazer amanhã, na ordem.
- `esforco`: baixo, médio ou alto, com tempo aproximado quando fizer sentido.

## Nome, bios e link

- **Nome pesquisável**: serviço ou assunto + (se local) cidade ou bairro + marca.
  Ex.: "Pilates Cambuí | Studio Luna".
- **3 bios**, cada uma priorizando algo diferente (clareza de público e lugar; prova; pessoa e
  método; oferta). Estrutura do curso: assunto, modo de ajudar, próximo passo. Até 150
  caracteres contando as quebras de linha (o script conta). Sem emoji no texto do relatório
  (o PDF não desenha emoji; o aluno acrescenta se quiser). Prova só real; sem ela, use
  `[CONFIRMAR: ...]` ou fique na versão sem prova.
- **Link**: um destino que cumpre a chamada da bio (WhatsApp com mensagem pronta, agenda,
  página da oferta). Não invente número de telefone: use `wa.me/55XXXXXXXXXXX`.

## Destaques e fixados

4 a 7 destaques na ordem de decisão (ex.: primeira vez ou como começar, como funciona,
provas, dúvidas, como chegar, sobre). Para cada um: nome curto (até ~12 caracteres para não
cortar), capa (ícone e cor no padrão da marca) e o que colocar. Fixados: apresentação do
assunto, prova e oferta.

## Plano de 30 dias

- Comece numa segunda-feira depois da data do relatório; 30 dias, um item por dia.
- Formatos aceitos: Reels, Carrossel, Estático, Stories, Live, Descanso.
- Caiba na capacidade real (horas de gravação, quem edita). Na dúvida, menos posts e mais
  constância. Referência do curso: mínimo de 3 por semana.
- Distribua pela máquina do alcance: Reels para alcance, carrossel para salvamentos, prova e
  oferta no fim da semana, Stories nos dias sem feed, 1 dia de descanso.
- `pauta` com até 110 caracteres (cabe na célula do calendário). Diga o molde quando houver
  (tela dividida, "não ignore", diálogo, transformação) e ligue aos roteiros e ideias.
- `rotina`: o que fazer antes do dia 1 (vitrine) e o ritmo semanal de gravação e edição.
- Reserve 1 ou 2 dias para responder dúvidas do público e o último dia para medir.

## 15 ideias com gancho

Pautas que nascem das perguntas e dores reais do público (comentários, direct, dúvidas que o
aluno contou). Cada ideia muda o problema resolvido, a evidência ou o contexto; "3 dicas" e
"3 segredos" sobre o mesmo assunto contam como uma ideia só. O gancho é a primeira frase ou o
texto da capa e cita uma situação reconhecível ou promessa que o post cumpre. Distribua entre
os pilares propostos. Em saúde, finanças e direito: nada de promessa de cura, ganho ou
resultado; oriente a procurar o profissional quando for o caso.

## 3 roteiros de Reels no GPEC

Escolha as 3 ideias com mais chance de cumprir o objetivo e use moldes diferentes (de
preferência formatos super virais do curso). Para cada bloco: tempo, fala (como a pessoa
fala, frases curtas, sem "cara de texto"), ação visual executável com o que o negócio tem e
texto na tela com poucas palavras. Uma única chamada no bloco CTA. `legenda`: gancho,
complemento e a mesma chamada. `por_que_funciona`: o molde e a ligação com o que já funcionou
no perfil. Duração total entre 25 e 60 segundos.

## Próximos passos (como medir)

Inclua: vitrine antes do calendário; medir cada peça 7 dias depois, na ficha do relatório;
métrica pela função da peça; perguntar a cada cliente novo como conheceu; repetir o Raio-X
em 30 dias com os mesmos prints, citando os 2 números a acompanhar (com os valores de hoje).

## Versão curta para WhatsApp

Para o aluno mandar ao dono do perfil (ou a si mesmo). Até ~1.200 caracteres, sem formatação
que o WhatsApp não mostra. No modo `meu-perfil`, troque a saudação por "Resumo do Raio-X do
[perfil] ([data])" e escreva na primeira pessoa ("a bio não diz o que eu vendo"). Estrutura:

```
Oi, [nome]! Terminei o Raio-X do Instagram do [perfil]. O relatório completo vai em PDF; aqui vai o resumo.

Nota geral: {nota_geral} de 10. [uma frase de leitura]

O que mais está custando:
1. ...
2. ...
3. ...

O que já funciona: ...

Para esta semana:
- ...
- ...
- ...

Preciso que você confirme: [itens CONFIRMAR mais importantes]
```

## Modo prospect: mensagem de abordagem

O aluno analisou um perfil de empresa que ainda não é cliente, só com dados públicos, e quer
oferecer a auditoria completa. A mensagem:
- se apresenta em uma frase (nome, o que faz, cidade se for local);
- dá **um elogio verdadeiro com número público** (o post que mais funcionou);
- aponta **no máximo 2 pontos** do pré-diagnóstico, sem humilhar o perfil;
- oferece a auditoria completa explicando o que muda com os Insights do dono (medição por
  alcance, bios, calendário, roteiros);
- termina com uma pergunta simples de permissão ("Posso te mandar o pré-diagnóstico?").

Não: preço na primeira mensagem, urgência falsa ("só hoje"), promessa de seguidores ou vendas,
nota do perfil na primeira mensagem, anexar o PDF sem pedir. O aluno envia pessoalmente, uma
mensagem por vez, para o perfil ou contato comercial público da empresa; se a resposta for
não, encerra ali. Você não envia nada.

## Como o aluno pode vender a auditoria (orientação, não promessa)

- **O que entregar**: o PDF completo, a versão curta e uma conversa de 20 a 30 minutos para
  apresentar os 5 problemas e o plano.
- **Preço**: pelo tempo que leva. Sugira que o aluno cronometre a primeira auditoria (coleta,
  conferência dos números, revisão do texto, conversa) e multiplique pelo valor da hora dele.
  Não sugira faixa de preço de mercado.
- **Continuação natural**: execução do plano de 30 dias (bios, destaques, roteiros, edição)
  e o Raio-X de revisão em 30 dias com os mesmos prints.
- **Cuidados**: pedir autorização por escrito para usar os prints dos Insights; não mostrar os
  números do cliente para outros clientes; não prometer crescimento ou vendas.
